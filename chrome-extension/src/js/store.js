
export class UserStore {
    // Global class which holds the collected data from repositories. Saving this data to the chrome storage results in errors and many
    // writes, so all data will be stored in a global variable and sent to a server for further processing when it is all collected.
    // This class is primarily used by the background.js file. When the browser is shut down, this data is cleared. This means that if a repo
    // was not completely parsed, it will start from scratch.

    constructor() {
        // variable holding all repo data currently being collected
        this.userDb = {}
    }

    newDb(repo) {
        // initialize this.userDb to an empty dataset
        this.userDb = {
            forks: {},
            forks_urls: [],
            stargazers: {},
            stargazers_urls: [],
            repo: repo
        }
    }

    isActiveRepo(repo) {
        // is the current repo the one we are collecting data for (we only collect data for one repo at a time)
        return this.userDb.repo == repo
    }

    set(type, key, value) {
        // set data to global variable by key value
        this.userDb[type][key] = value
    }

    getAll() {
        return this.userDb
    }
}

// export global instance of UserStore class
export const userStore = new UserStore()

export class UrlStore {
    // Url store uses the chrome storage to hold the URLs which have been saved for future parsing. This is persistent even
    // when the browser is shut off. When the browser starts it will trigger the background.js file and continue inspecting repositories
    // from the stored queue.

    constructor() {
        // initialize URL_STORE and URL_QUEUE in storage.
        // URL_STORE - data for a particular url (for instance, the progress of the inspection)
        // URL_QUEUE - The order in which repos will be inspected.
        chrome.storage.local.get(async ({ URL_STORE }) => {
            if (!URL_STORE) {
                URL_STORE = {}
                chrome.storage.local.set({ URL_STORE })
            }
        })
        chrome.storage.local.get(async ({ URL_QUEUE }) => {
            if (!URL_QUEUE) {
                URL_QUEUE = []
                chrome.storage.local.set({ URL_QUEUE })
            }
        })
      }
      

    async verifyDeleted(url) {
        // check if the user just deleted this repo
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ DELETED_REPO }) => {
                if (DELETED_REPO && DELETED_REPO[url]) {
                    // repo was deleted
                    resolve(true)
                }
                // repo was not deleted
                resolve(false)
            })
          });
    }

    async get(url) {
        // get data for url from URL_STORE
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_STORE }) => {
                if (!URL_STORE[url]) {
                    const data = {}
                    this.set(url, data)
                    resolve(data)
                }
                resolve(URL_STORE[url])
            })
          });
    }

    set(url, value) {
        // set data for url in URL_STORE
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_STORE }) => {
                URL_STORE[url] = value;
                chrome.storage.local.set({ URL_STORE })
                resolve()
            })
        })
    }

    setHistory(url, value) {
        // set data for url in URL_HISTORY
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_HISTORY }) => {
                if (!URL_HISTORY) {
                    URL_HISTORY = []
                }
                URL_HISTORY.unshift({url: url, data: value});
                chrome.storage.local.set({ URL_HISTORY })
                resolve()
            })
        })
    }

    removeHistory(i) {
        // remove data for url in URL_HISTORY
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_HISTORY }) => {
                URL_HISTORY.splice(i, 1);
                chrome.storage.local.set({ URL_HISTORY })
                resolve()
            })
        })
    }

    async getHistory() {
         const {URL_HISTORY} = await chrome.storage.local.get(['URL_HISTORY']);
         return URL_HISTORY
    }

    async createUrl(url, stargazers_count, forks, name, settings) {
        // set to store data for a new repo
        await this.clearDelete(url);
        const urlData = await urlStore.get(this.repoUrl);
        urlData.url = url
        urlData.stargazers_count = stargazers_count
        urlData.forks_count = forks
        urlData.stargazers = {}
        urlData.forks = {}
        urlData.progress = {forks: 0, stargazers: 0}
        urlData.queueProgress = {current: 0, max: 1}
        urlData.name = name
        // get snapshot of inspection settings
        urlData.settings = settings;
        this.setUrlQueue(url);
        return this.set(url, urlData)
    }

    async saveUrl(url, urlData) {
        // extract only what if important to hold for history display
        const data = {
            url: urlData.url,
            stargazers_count: urlData.stargazers_count,
            forks_count: urlData.forks_count,
            progress: urlData.progress,
            queueProgress: urlData.queueProgress,
            name: urlData.name,
            settings: urlData.settings,
            inspectionTime: new Date().getTime()
        }
        await this.remove(url);
        return this.setHistory(url, data)
    }

    async newRepo() {
        // save if the user just deleted this repo
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ NEW_REPO }) => {
                if (NEW_REPO) {
                    const repo = NEW_REPO;
                    // there is a new repo, now set the status to false
                    resolve(repo)
                }
                resolve(false)
            })
          });
    }

    async clearNewRepo() {
        const NEW_REPO = false;
        await chrome.storage.local.set({ NEW_REPO })
    }

    clearDelete(url) {
        // remove url from list of deleted urls
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ DELETED_REPO }) => {
                if (DELETED_REPO) {
                    delete DELETED_REPO[url]
                    await chrome.storage.local.set({ DELETED_REPO })
                }
                resolve()
            })
        })
    }

    setUrlQueue(url) {
        // set url in URL_QUEUE list
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_QUEUE }) => {
                if (!URL_QUEUE.includes(url)) {
                    URL_QUEUE.push(url)
                    await chrome.storage.local.set({ URL_QUEUE })
                }
                const NEW_REPO = url
                await chrome.storage.local.set({ NEW_REPO })
                resolve()
            })
        })
    }

    deleteUrlQueue(url) {
        // remove url from URL_QUEUE list
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_QUEUE }) => {
                let index = URL_QUEUE.indexOf(url);
                if (index !== -1) {
                    URL_QUEUE.splice(index, 1);
                }
                chrome.storage.local.set({ URL_QUEUE })
                resolve()
            })
        })
    }

    getUrlQueue() {
        // get entire URL_QUEUE
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_QUEUE }) => {
                resolve(URL_QUEUE)
            })
        })
    }

    remove(url) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async(resolve) => {
        chrome.storage.local.get(async ({ URL_STORE }) => {
                delete URL_STORE[url]
                chrome.storage.local.set({ URL_STORE })
                resolve()
            })
        })
    }

    delete(url) {
        // remove all data for url from URL_STORE
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async(resolve) => {
            // set param for stopping live parsers
            chrome.storage.local.get(({ DELETED_REPO }) => {
                if (!DELETED_REPO) {
                    DELETED_REPO = {}
                }
                DELETED_REPO[url] = 1
                chrome.storage.local.set(({ DELETED_REPO }));
            });

            await this.deleteUrlQueue(url);
            await this.remove(url);
            resolve();
        })
    }

    async all() {
        // retrieve entire URL_STORE data
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ URL_STORE }) => {
                if (!URL_STORE) {
                    resolve({})
                }
                resolve(URL_STORE)
            })
          });
    }

    list() {
        // list all keys in URL_STORE
        return new Promise((resolve) => {
        chrome.storage.local.get(async ({ URL_STORE }) => {
            if (URL_STORE) {
                resolve(Object.keys(URL_STORE))
            }
            else {
                resolve([])
            }
        })
        })
    }

}

export const urlStore = new UrlStore();



export class SettingsStore {

    constructor() {
        // settings model
        this.settings = {
            stars: true,
            forks: false,
            sample: false,
            samplePercent: 0,
            location: true,
        }

        chrome.storage.local.get(async ({ SETTINGS }) => {
            if (!SETTINGS) {
                SETTINGS = this.settings
                chrome.storage.local.set({ SETTINGS })
            }
        })
      }

    load() {
        return chrome.storage.local.get(['SETTINGS'])
    }

    set(SETTINGS) {
        return chrome.storage.local.set({ SETTINGS })
    }
}

export const settingsStore = new SettingsStore();