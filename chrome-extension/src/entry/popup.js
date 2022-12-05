import { createApp } from 'vue'
import App from '../view/popup.vue'

import '@picocss/pico'
import '../assets/scss/alerts.scss'
import '../assets/scss/transition.scss'
import '../assets/scss/custom.scss'

import { initToken, initUrl } from '@/js/helpers';
import { downloaderStore } from '@/js/store/downloader'
import { historyStore } from '@/js/store/history'

export let token;
export let url;
export let history;
export let downloader;

(async ()=> {
    // initialize storage data before loading the app
    token = await initToken();
    url = await initUrl();
    downloader = await downloaderStore.get();
    history = await historyStore.get();
    const app = createApp(App);
    app.mount('#app');
  })();
