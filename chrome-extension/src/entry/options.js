import { createApp } from 'vue'
import App from '../view/options.vue'

// const { Octokit } = require("@octokit/core");
// let octokit;
// const PER_PAGE = 100;
import { urlStore } from '@/js/store'
import { initToken } from '@/js/helpers';
import { queueService } from '@/js/queue'

import '@picocss/pico'
import '../assets/scss/alerts.scss'
import '../assets/scss/transition.scss'

export let token;
export let url;
export let urlList;
export let urlStoreData;
export let urlQueue;
export let currentRepo;
export let history;

(async ()=> {
    // initialize storage data before loading the app
    token = await initToken();
    urlList = await urlStore.list();
    urlStoreData = await urlStore.all();
    urlQueue = await urlStore.getUrlQueue();
    currentRepo = await queueService.currentRepo();
    history = await urlStore.getHistory();

    const app = createApp(App);
    app.mount('#app');
  })();

  // prevent users from closing download page by mistake
  const preventClose = function (e) {
    chrome.runtime.sendMessage({
      msg: "notifyBeforeClose"
    })
    e.preventDefault();
    e.returnValue = '';
    return true
}
  window.addEventListener('beforeunload', preventClose, true);

