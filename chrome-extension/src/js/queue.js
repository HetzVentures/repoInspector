import { initOctokit } from '@/js/octokit.js';
import { urlStore, userStore, settingsStore } from '@/js/store.js';
import { api } from '@/js/api'
import { initToken, timeout } from './helpers';
import { auth } from '@/js/authentication'

const LOCATION_REQUEST_THROTTLE = 1000;
const REQUEST_THROTTLE_NO_LOCATION = 300;
const STORAGE_WRITE_THROTTLE = 100;
const SYNC_THROTTLE = 5;
const NOMINATIM_LOCATION_API_Q = "https://nominatim.openstreetmap.org/search.php?format=jsonv2&addressdetails=1&q=";
let octokit;

initToken().then(token => octokit = initOctokit(token))


class Queue {
    constructor() {
      this.items = {};
      this.headIndex = 0;
      this.tailIndex = 0;
    }
    enqueue(item) {
      this.items[this.tailIndex] = item;
      this.tailIndex++;
    }
    dequeue() {
      const item = this.items[this.headIndex];
      delete this.items[this.headIndex];
      this.headIndex++;
      return item;
    }
    peek() {
      return this.items[this.headIndex];
    }
    get length() {
      return this.tailIndex - this.headIndex;
    }
}


class QueueService {
    constructor() {
        this.queue = new Queue();
        this.interval = null;
        // repo currently in queue
        this.currentRepoUrl = null;
        // progress of collecting the user urls for an asset (like stargazers or forks).
        // this data will be key valued by the repo: urlUserProgress = {<repoUrl>: {forks: bool, stargazers: bool}}
        // see inspectAssets and run functions for usage
        this.urlUserProgress = {};
        this.settings = settingsStore.settings;
      }


      async currentRepo() {
        // get the repo that is currently being inspected. This function manages the prospect of multiple
        // calls to inspect multiple repos, and only allows one repo to be inspected at a time.
        const urlQueue = await urlStore.getUrlQueue()
        if (urlQueue && urlQueue.length) {
            const peekRepoUrl = urlQueue[0];
            if (this.currentRepoUrl && this.currentRepoUrl !== peekRepoUrl) {
                // if the queue service is already running on a repo, don't start working on a new one
                return null
            }
            else {
                return peekRepoUrl;
            }
        }
    }

    _saveQueueState() {
        // save queue state for when service worker resets
        const QUEUE_STATE = {
            items: this.queue.items,
            headIndex: this.queue.headIndex,
            tailIndex: this.queue.tailIndex,
            userDb: userStore.userDb,
            currentRepoUrl: this.currentRepoUrl,
            urlUserProgress: this.urlUserProgress,
            settings: this.settings
        }
        chrome.storage.local.set({ QUEUE_STATE })
    }

    _loadQueueState() {
        // load queue state for when service worker resets
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ QUEUE_STATE }) => {
                if (QUEUE_STATE) {
                    this.queue.items = QUEUE_STATE.items;
                    this.queue.headIndex = QUEUE_STATE.headIndex;
                    this.queue.tailIndex = QUEUE_STATE.tailIndex;
                    this.currentRepoUrl = QUEUE_STATE.currentRepoUrl;
                    this.urlUserProgress = QUEUE_STATE.urlUserProgress;
                    this.settings =  QUEUE_STATE.settings;
                    userStore.userDb = QUEUE_STATE.userDb;
                    resolve(true)
                }
                else {
                    resolve(false)
                }
            })
        })
    }

    _clearQueueState() {
        chrome.storage.local.remove(['QUEUE_STATE'])
    }
    

    async _storeUserUrlProgress(repo) {
        // the popover is not in the same scope as the background job, so we save data to storage for front end display
        const urlData = await urlStore.get(repo);
        urlData.progress = this.urlUserProgress[repo];
        // prevent race condition of saved state after delete
        let deleted = await urlStore.verifyDeleted(repo)
        if (!deleted) {
            await urlStore.set(repo, urlData)
        }
    }

    async _storeQueueProgress(repo) {
        // the popover is not in the same scope as the background job, so we save data to storage for front end display
        const urlData = await urlStore.get(repo);
        urlData.queueProgress = {current: this.queue.headIndex, max: this.queue.tailIndex}
        let deleted = await urlStore.verifyDeleted(repo)
        if (!deleted) {
            await urlStore.set(repo, urlData)
        }
    }
    
    async initUrlUserProgress(repo) {
        // initialize progress of user url collection (the list of urls)
        this.urlUserProgress[repo] = {stargazers: null, forks: null}
        await this._storeUserUrlProgress(repo);
    }

    updateUrlUserProgress(repo, type, value) {
        // update progress of user url collection (the list of urls)
        this.urlUserProgress[repo][type] = value
        this._storeUserUrlProgress(repo);
    }

    setQueueProgress() {
        // set progress of collecting url data from user urls.
        // In order to display progress on the client side we must write the progress to storage from the background job.
        // To limit writing to the storage too often (it can crash the extension) we only write to the storage once every STORAGE_WRITE_THROTTLE
        if (this.queue.length <= 1 || this.queue.length % SYNC_THROTTLE === 0) {
            this._storeQueueProgress(this.currentRepoUrl);
        if (this.queue.length <= 1 || this.queue.length % STORAGE_WRITE_THROTTLE === 0)
            this._saveQueueState();
        }
    }

    async getLocation(location) {
        // using a geocoding API, get location data for a given string
        const r = await fetch(`${NOMINATIM_LOCATION_API_Q}${location}`);
        return r.json();
    }

    async storeUserData(userData, type, userUrl) {
        // get location data from the github location str
        if (userData.location && this.settings.location) {
            try {
                let locationData = await this.getLocation(userData.location);
                userData.country = locationData[0]?.address?.country;
                userData.lat = locationData[0]?.lat;
                userData.lon = locationData[0]?.lon;
            }
            catch(error) {
                console.error(error)
            }
        }

        // get user event count
        const { data } = await octokit.request(`GET ${userData.url}/events?per_page=100`)
        userData["event_count"] = data.length;

        // define real user
        userData["real_user"] = userData.event_count > 3 || userData.followers > 3;

        // define active user
        const yearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).getTime();
        userData["active_user"] = (data.length &&
             data[0]?.created_at && 
             new Date(data[0]?.created_at).getTime() > yearAgo);

        // save user data
        userStore.set(type, userUrl, userData);
        this.setQueueProgress()
    }
    
    async getUser(type, userUrl) {
        const { data } = await octokit.request(`GET ${userUrl}`)
        this.storeUserData(data, type, userUrl);
    }

    async runGetUser() {
        // only continue if repo hasn't been deleted
        let deleted = await urlStore.verifyDeleted(this.currentRepoUrl)
        if (deleted) {
            this.deactivateInterval()
            this.queue = new Queue();
            return
        }
        if (this.queue.length) {
        // if there are items in the queue, fetch them
        let currentQuery = this.queue.dequeue();
        this.getUser(currentQuery.type, currentQuery.userUrl)
        }
        else {
            this.deactivateInterval();
            // allow any other request to finish
            timeout(2000);
            this._finishInspection();      

            // if the queue is done and we have collected all the user urls
            // if (this.urlUserProgress[this.currentRepoUrl].stargazers && this.urlUserProgress[this.currentRepoUrl].forks) {
            //     this._finishInspection();      
            // }
        }
    }

    async _finishInspection() {
        // on finish inspection we deactivate the interval and send the data to the server for packaging and emailing it.
        this.deactivateInterval()
        const urlData = await urlStore.get(this.currentRepoUrl);
        urlData.done = true;

        const userData = userStore.getAll()
        let postData = {
            repository: urlData,
            forks: Object.values(userData.forks),
            stargazers: Object.values(userData.stargazers)
        }
        try {
            await api.post(`repository/?user_id=${auth.currentUser.uuid}`, postData)
            urlData.sentStatus = "success"
        }
        catch(error) {
            console.log(error)
            urlData.sentStatus = error
        }

        urlStore.saveUrl(this.currentRepoUrl, urlData);

        // remove repo from inspection queue
        await urlStore.deleteUrlQueue(this.currentRepoUrl)        
    }

      run(currentRepoUrl) {
        this.currentRepoUrl = currentRepoUrl;
        if (!this.urlUserProgress[currentRepoUrl]) {
            // initialize urlUserProgress for this repo
            this.initUrlUserProgress(currentRepoUrl)
        }

        if (!this.interval) {
            let throttle = REQUEST_THROTTLE_NO_LOCATION;
            if (this.settings.location) {
                throttle = LOCATION_REQUEST_THROTTLE
            }
            this.interval = setInterval(() => {this.runGetUser()}, throttle);
        }
      }

      deactivateInterval() {
        // reset the queue and clear the interval.
        this.queue = new Queue();
        this._clearQueueState();
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
      }

      async continueFromSave() {
        if (!this.interval) {
            const loadState = await this._loadQueueState();
            if (loadState) {
                this.run(this.currentRepoUrl);
            }
        }
      }
}

export const queueService = new QueueService()