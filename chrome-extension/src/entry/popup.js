import { createApp } from 'vue'
import App from '../view/popup.vue'

import '@picocss/pico'
import '../assets/scss/alerts.scss'
import '../assets/scss/transition.scss'
import '../assets/scss/custom.scss'

import { initToken, initUrl } from '@/js/helpers';
import { downloaderStore } from '@/js/store/downloader'
import { historyStore } from '@/js/store/history'

import settings from '@/js/env';
import Rollbar from 'rollbar';

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

    // Set the Rollbar instance in the Vue prototype
    // before creating the first Vue instance.
    // This ensures it is available in the same way for every
    // instance in your app.
    app.config.globalProperties.$rollbar = new Rollbar({
      accessToken: settings?.rollbarAccessToken,
      captureUncaught: true,
      captureUnhandledRejections: true,
      payload: {
        // Track your events to a specific version of code for better visibility into version health
        code_version: '1.0.0',
        // Add custom data to your events by adding custom key/value pairs like the one below
        custom_data: 'foo'
      }
    });


    // If you have already set up a global error handler,
    // just add `vm.$rollbar.error(err)` to the top of it.
    // If not, this simple example will preserve the app’s existing
    // behavior while also reporting uncaught errors to Rollbar.
    app.config.globalProperties.errorHandler = (err, vm, info=null) => {
      vm.$rollbar.error(err);
      console.log(err, info);
      throw err; // rethrow
    };

    app.mount('#app');
  })();
