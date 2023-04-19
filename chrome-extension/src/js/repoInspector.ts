import { asyncForEach, initToken, timeout } from './helpers';
import { initOctokit } from './octokit';
import { userUrlQueue } from './userUrlQueue';
import { downloaderStore } from './store/downloader';

// let running = {stargazers: false, forks: false};
let octokit;
const PER_PAGE = 100;

initToken().then((token) => {
  octokit = initOctokit(token);
});

class RepoInspector {
  constructor() {
    this.currentRepo = null;
  }

  async inspectAssets(downloader) {
    // Set up the inspectionParams based on the inspection settings
    const inspectionParams = [];

    if (downloader.settings?.stars) {
      inspectionParams.push({
        mapper: (data) => data.map((x) => x.url),
        type: 'stargazers',
        max: downloader.stargazers_count,
      });
    }

    if (downloader.settings?.forks) {
      inspectionParams.push({
        mapper: (data) => data.map((x) => x.owner.url),
        type: 'forks',
        max: downloader.forks_count,
      });
    }

    this.inspect(inspectionParams);
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

    await asyncForEach(inspectionParams, async (inspection) => {
      const { type, max, mapper } = inspection;

      // the github API return a max of PER_PAGE users per API call, the max pages we must parse to inspect the repo is therefore <user_count>/PER_PAGE
      const maxPages = Math.ceil(max / PER_PAGE);
      // Look for all assets's users
      for (
        let inspectedPages = 1;
        inspectedPages <= maxPages;
        inspectedPages++
      ) {
        // while we haven't finished parsing through the current chunk, look for users in repo
        try {
          const downloader = await downloaderStore.get();
          if (!downloader.active) {
            // only continue if repo hasn't been deleted
            return;
          }

          const url = `${downloader.octokitUrl}/${type}?page=${inspectedPages}&per_page=${PER_PAGE}`;
          const status = await this.run(type, url, mapper);
          // status will return false if the attempt to get more user links is blocked by github

          if (!status) {
            break;
          }
        } catch (error) {
          console.log(error);
        }
      }
    });

    // after all data has been added to the queue, update inspector settings on queue and activate the queue interval
    userUrlQueue.run();
  }

  async run(type, url, mapper) {
    // TODO run over inputted url and store the data. At the end of a inspection look over all failed URLs and retry them
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      // const users = []
      try {
        const downloader = await downloaderStore.get();
        if (!downloader.active) {
          // only continue adding to queue if repo hasn't been deleted
          resolve(true);
        }
        // minimal throttling for initial run. This makes sure that if we have many stars and forks we don't endanger the limit
        await timeout(300);
        const { data } = await octokit.request(`GET ${url}`);
        const userUrls = mapper(data);
        if (!userUrls.length) {
          // there aren't any more pages to look through
          resolve(true);
        }
        userUrls.forEach(async (userUrl, i, arr) => {
          // add the user url and the parsing type to the queue service to gather further data.
          // we use a queue as fetching the data directly can hit rate limits on the API. We don't want to control
          // for that in this part of the code because this code runs every minute and could potentially trigger multiple
          // queries simultaneously. Instead we run the queries directly through the queue in a single thread with throttling
          // to account for API needs.

          userUrlQueue.queue.enqueue({ type, userUrl });

          if (i === arr.length - 1) {
            resolve(true);
          }
        });
      } catch (error) {
        if (error.message.includes('rel=last')) {
          alert(
            'Seems like this is a really big repo, we will start inspecting what github has allowed us',
          );
          resolve(false);
        } else {
          alert(`Github is blocking us: ${error}`);
          resolve(false);
        }
      }
    });
  }
}

export const repoInspector = new RepoInspector();
