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

  async set(DOWNLOADER: Downloader) {
    // set data for url in DOWNLOADER
    await chrome.storage.local.set({ DOWNLOADER });
  }

  async get(): Promise<Downloader> {
    const { DOWNLOADER } = (await chrome.storage.local.get()) as {
      DOWNLOADER: Downloader;
    };

    return DOWNLOADER;
  }
}

export const downloaderStore = new DownloaderStore();
