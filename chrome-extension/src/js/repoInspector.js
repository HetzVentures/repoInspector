import { apiUrl, initToken, timeout } from '@/js/helpers.js';
import { initOctokit } from '@/js/octokit.js';
import { userStore, urlStore } from '@/js/store.js';
import { queueService } from '@/js/queue.js'

// let running = {stargazers: false, forks: false};
let octokit;
const PER_PAGE = 100;

initToken().then(token => octokit = initOctokit(token))

export class RepoInspector {
    async inspectAssets() {
        // set the mapper function for the returned GET request from octokit. Sometimes the user link will be nested
        // like in this case where the object "owner" contains the users url
        const repo = await queueService.currentRepo();
        if (!repo) {
            return
        }
        if (!userStore.isActiveRepo(repo)) {
            userStore.newDb(repo)
        }
        const inspectionParams = [
            {
                mapper: (data)=> data.map(x => x.url),
                type: "stargazers"
            },
            {
                mapper: (data)=> data.map(x => x.owner.url),
                type: "forks"
            }
        ]
        this.inspect(inspectionParams)
    }

    async inspect(inspectionParams) {
        // inspect function runs in the background and looks at all the users from "forks" and "stargazers" lists. For each
        // one of these categories, the octokit API will return PER_PAGE users. As the background job runs every minute, and both
        // "forks" and "stargazers" are run sequentially, this results in an initial set of API calls made to collect the users urls.
        // The "inspect" function can handle only one repo at a time, once it is done extracting all the user urls, it sends them to a queueing
        // service (see queue.js) so that the data can be collected and throttled to manage rate limits.
        // The data it collected by the qto a server for further processing.
        // All data regarding a particular repo are stored in a JS object and not in the local storage. This means that if chrome is
        // restarted, all data collected will be lost.

        const repo = await queueService.currentRepo();
        const urlData = await urlStore.get(repo);

        // initialize data collection progress
        await queueService.initUrlUserProgress(repo);

        for (let inspection of inspectionParams) {
            
            const type = inspection.type;
            const mapper = inspection.mapper;
            
            // the github API return a max of PER_PAGE users per API call, the max pages we must parse to inspect the repo is therefore <user_count>/PER_PAGE
            const maxPages = Math.ceil(urlData[`${type}_count`]/PER_PAGE)
    
            // Look for all assets's users
            for (let inspectedPages = 1; inspectedPages <= maxPages; inspectedPages++) {
                // while we haven't finished parsing through the current chunk, look for users in repo
                try {
                    let deleted = await urlStore.verifyDeleted(repo)
                    if (deleted) {
                        // only continue if repo hasn't been deleted
                        return
                    }

                    const url = `${apiUrl(repo)}/${type}?page=${inspectedPages}&per_page=${PER_PAGE}`
                    await this.run(type, url, mapper, repo);
                }
                catch(error) {
                    console.log(error)
                }
            }
            queueService.updateUrlUserProgress(repo, type, 1)

        }
        // after all data has been added to the queue, activate the queue interval
        
        queueService.run(repo);
    }

    
    async run(type, url, mapper, repo) {
        // TODO run over inputted url and store the data. At the end of a inspection look over all failed URLs and retry them
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            // const users = []
            try {
                let deleted = await urlStore.verifyDeleted(repo)
                if (deleted) {
                // only continue adding to queue if repo hasn't been deleted
                resolve()
            }
                // minimal throttling for initial run. This makes sure that if we have many stars and forks we don't endanger the limit
                await timeout(300);
                const { data } = await octokit.request(`GET ${url}`)
                const userUrls = mapper(data)
                if (!userUrls.length) {
                    // there aren't any more pages to look through
                    resolve()
                }
                userUrls.forEach(async (userUrl, i, arr) => {
                    // add the user url and the parsing type to the queue service to gather further data.
                    // we use a queue as fetching the data directly can hit rate limits on the API. We don't want to control
                    // for that in this part of the code because this code runs every minute and could potentially trigger multiple
                    // queries simultaneously. Instead we run the queries directly through the queue in a single thread with throttling
                    // to account for API needs.

                    queueService.queue.enqueue({type, userUrl})
    
                    if (i === arr.length - 1){ 
                        resolve()
                    }
                })
            }
            catch(error) {
                console.error(error)
            }
        })
    }
}