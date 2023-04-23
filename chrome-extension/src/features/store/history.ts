import { HISTORY_MODEL } from "./models";

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

  async get(): Promise<HistoryType> {
    const { URL_HISTORY = [] } = (await chrome.storage.local.get()) as {
      URL_HISTORY: HistoryType;
    };

    return URL_HISTORY;
  }

  async set(value: Downloader) {
    const URL_HISTORY = await this.get();

    await chrome.storage.local.set({ URL_HISTORY: [value, ...URL_HISTORY] });
  }

  async remove(i: number) {
    // remove data for url in URL_HISTORY
    const URL_HISTORY = await this.get();

    URL_HISTORY.splice(i, 1);

    await chrome.storage.local.set({ URL_HISTORY });
  }
}

export const historyStore = new HistoryStore();
