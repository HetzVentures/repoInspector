import { createApp } from 'vue'
import App from '../view/popup.vue'

import '@picocss/pico'
import '../assets/scss/alerts.scss'
import '../assets/scss/transition.scss'

import { urlStore } from '@/js/store'
import { initToken, initUrl } from '@/js/helpers';
import { queueService } from '@/js/queue'

export let token;
export let url;
export let urlList;
export let urlStoreData;
export let urlQueue;
export let currentRepo;

(async ()=> {
    // initialize storage data before loading the app
    token = await initToken();
    url = await initUrl();
    urlList = await urlStore.list();
    urlStoreData = await urlStore.all();
    urlQueue = await urlStore.getUrlQueue();
    currentRepo = await queueService.currentRepo();

    const app = createApp(App);
    app.mount('#app');
  })();
