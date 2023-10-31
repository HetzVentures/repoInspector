import { DOWNLOADER_MODEL } from './models';

class DownloaderStore {
  constructor() {
    chrome.storage.local.get(async ({ DOWNLOADER }) => {
      if (!DOWNLOADER ?? !DOWNLOADER.totalRatingWeights) {
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

  async setStage(stage: number) {
    const { DOWNLOADER } = (await chrome.storage.local.get()) as {
      DOWNLOADER: Downloader;
    };

    const downloader = { ...DOWNLOADER, stage };

    await chrome.storage.local.set({ DOWNLOADER: downloader });
  }

  async setWeightsSettings(totalRatingWeights: TotalRatingWeights) {
    const { DOWNLOADER } = (await chrome.storage.local.get()) as {
      DOWNLOADER: Downloader;
    };

    const downloader = { ...DOWNLOADER, totalRatingWeights };

    await chrome.storage.local.set({ DOWNLOADER: downloader });
  }

  async increaseProgress(value = 1) {
    const { DOWNLOADER } = (await chrome.storage.local.get()) as {
      DOWNLOADER: Downloader;
    };

    const downloader = {
      ...DOWNLOADER,
      progress: {
        ...DOWNLOADER.progress,
        current: DOWNLOADER.progress.current + value,
      },
    };

    await chrome.storage.local.set({ DOWNLOADER: downloader });
  }
}

export const downloaderStore = new DownloaderStore();
