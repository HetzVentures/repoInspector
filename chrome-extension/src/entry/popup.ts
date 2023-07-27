import { createApp } from 'vue';
import App from '@/view/popup.vue';

import '@picocss/pico';
import '../assets/scss/alerts.scss';
import '../assets/scss/transition.scss';
import '../assets/scss/custom.scss';

import { initToken, initUrl } from '@/features/utils';
import { downloaderStore } from '@/features/store/downloader';
import { historyStore } from '@/features/store/history';

import settings from '@/features/env';
import Rollbar from 'rollbar';
import { initGeoNamesLogin } from '@/features/utils/initGeoNamesLogin';

interface InitialData {
  token: null | void | string;
  geoNamesLoginData: GeoNamesLoginData;
  url: null | string;
  history: null | HistoryType;
  downloader: null | Downloader;
}

export const initialData: InitialData = {
  token: null,
  geoNamesLoginData: { skipped: false, login: null },
  url: null,
  history: null,
  downloader: null,
};

(async () => {
  // initialize storage data before loading the app
  initialData.token = await initToken();
  initialData.geoNamesLoginData = await initGeoNamesLogin();
  initialData.url = await initUrl();
  initialData.downloader = await downloaderStore.get();
  initialData.history = await historyStore.get();

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
      custom_data: 'foo',
    },
  });

  // If you have already set up a global error handler,
  // just add `vm.$rollbar.error(err)` to the top of it.
  // If not, this simple example will preserve the app’s existing
  // behavior while also reporting uncaught errors to Rollbar.
  app.config.globalProperties.errorHandler = (
    err: any,
    vm: any,
    info = null,
  ) => {
    vm.$rollbar.error(err);
    console.log(err, info);
    throw err; // rethrow
  };

  app.mount('#app');
})();
