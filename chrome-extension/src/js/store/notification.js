import { NOTIFICATION_MODEL } from './models';

export class NOTIFICATION_TYPES {
  static SUCCESS = 'success';

  static ERROR = 'error';
}

export class NotificationStore {
  constructor() {
    chrome.storage.local.get(async ({ NOTIFICATION_STORE }) => {
      if (!NOTIFICATION_STORE) {
        chrome.storage.local.set({ NOTIFICATION_STORE: NOTIFICATION_MODEL });
      }
    });
  }

  set(value) {
    // set data for url in NOTIFICATION_STORE
    return new Promise((resolve) => {
      chrome.storage.local.get(async ({ NOTIFICATION_STORE }) => {
        NOTIFICATION_STORE.unshift(value);
        chrome.storage.local.set({ NOTIFICATION_STORE });
        resolve();
      });
    });
  }

  get() {
    return new Promise((resolve) => {
      chrome.storage.local.get(async ({ NOTIFICATION_STORE }) => {
        resolve(NOTIFICATION_STORE || []);
      });
    });
  }

  remove(i) {
    // remove data for url in NOTIFICATION_STORE
    return new Promise((resolve) => {
      chrome.storage.local.get(async ({ NOTIFICATION_STORE }) => {
        NOTIFICATION_STORE.splice(i, 1);
        chrome.storage.local.set({ NOTIFICATION_STORE });
        resolve();
      });
    });
  }

  async checkTabFocused(document, showMessage, showError) {
    // check if tab is focused and show notifications
    if (document.visibilityState === 'visible') {
      const notifications = await this.get();
      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];
        if (notification.type === NOTIFICATION_TYPES.ERROR) {
          showError(notification.message);
        } else if (notification.type === NOTIFICATION_TYPES.SUCCESS) {
          showMessage(notification.message);
        }
        this.remove(i);
      }
    }
  }

  initTabFocusListener(document, showMessage, showError) {
    // check if tab is focused and show notifications
    const runCheckTabFocused = async () => {
      this.checkTabFocused(document, showMessage, showError);
    };
    // init listener for tab focus
    document.addEventListener('visibilitychange', runCheckTabFocused);
  }
}

export const notificationStore = new NotificationStore();
