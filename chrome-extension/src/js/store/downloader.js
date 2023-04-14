import { DOWNLOADER_MODEL } from './models';

class DownloaderStore {
  constructor() {
    chrome.storage.local.get(async ({ DOWNLOADER }) => {
      if (!DOWNLOADER) {
        chrome.storage.local.set({ DOWNLOADER: DOWNLOADER_MODEL });
      }
    });
  }

  async reset() {
    await chrome.storage.local.set({ DOWNLOADER: DOWNLOADER_MODEL });
  }

  async set(DOWNLOADER) {
    // set data for url in DOWNLOADER
    await chrome.storage.local.set({ DOWNLOADER });
  }

  get() {
    return new Promise((resolve) => {
      chrome.storage.local.get(async ({ DOWNLOADER }) => {
        resolve(DOWNLOADER);
      });
    });
  }
}

export const downloaderStore = new DownloaderStore();
