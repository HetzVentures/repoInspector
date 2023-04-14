import { HISTORY_MODEL } from './models';

export class HistoryStore {
  constructor() {
    chrome.storage.local.get(async ({ URL_HISTORY }) => {
      if (!URL_HISTORY) {
        chrome.storage.local.set({ URL_HISTORY: HISTORY_MODEL });
      }
    });
  }

  async reset() {
    await chrome.storage.local.set({ URL_HISTORY: HISTORY_MODEL });
  }

  set(value) {
    // set data for url in URL_HISTORY
    return new Promise((resolve) => {
      chrome.storage.local.get(async ({ URL_HISTORY }) => {
        URL_HISTORY.unshift(value);
        chrome.storage.local.set({ URL_HISTORY });
        resolve();
      });
    });
  }

  get() {
    return new Promise((resolve) => {
      chrome.storage.local.get(async ({ URL_HISTORY }) => {
        if (!URL_HISTORY) {
          URL_HISTORY = [];
        }
        resolve(URL_HISTORY);
      });
    });
  }

  remove(i) {
    // remove data for url in URL_HISTORY
    return new Promise((resolve) => {
      chrome.storage.local.get(async ({ URL_HISTORY }) => {
        URL_HISTORY.splice(i, 1);
        chrome.storage.local.set({ URL_HISTORY });
        resolve();
      });
    });
  }
}

export const historyStore = new HistoryStore();
