import { createApp } from 'vue'
import App from '../view/options.vue'

import { historyStore } from '@/js/store/history'
import { initToken } from '@/js/helpers';

import '@picocss/pico'
import '../assets/scss/alerts.scss'
import '../assets/scss/transition.scss'
import { downloaderStore } from '@/js/store/downloader';

export let token;
export let history;
export let downloader;

(async ()=> {
    // initialize storage data before loading the app
    token = await initToken();
    history = await historyStore.get();
    downloader = await downloaderStore.get();

    const app = createApp(App);
    app.mount('#app');
  })();

  // prevent users from closing download page by mistake
  const preventClose = (e) => {
    e.preventDefault();
    e.returnValue = '';
    return true
}
  window.addEventListener('beforeunload', preventClose, true);

