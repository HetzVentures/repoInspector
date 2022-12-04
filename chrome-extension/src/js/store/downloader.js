import { DOWNLOADER_MODEL } from "./models";

class DownloaderStore {
    constructor() {
        chrome.storage.local.get(async ({ DOWNLOADER }) => {
            if (!DOWNLOADER) {
                DOWNLOADER = DOWNLOADER_MODEL;
                chrome.storage.local.set({ DOWNLOADER })
            }
        })
    }

    async reset() {
        const DOWNLOADER = DOWNLOADER_MODEL;
        await chrome.storage.local.set({ DOWNLOADER })
    }


    async set(DOWNLOADER) {
        // set data for url in DOWNLOADER
        await chrome.storage.local.set({ DOWNLOADER })
    }

    get() {
        return new Promise((resolve) => {
            chrome.storage.local.get(async ({ DOWNLOADER }) => {
                resolve(DOWNLOADER)
            })
        })
    }
}

export const downloaderStore = new DownloaderStore();