import { NOTIFICATION_MODEL } from './models';

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
};

export class NotificationStore {
  constructor() {
    chrome.storage.local.get(async ({ NOTIFICATION_STORE }) => {
      if (!NOTIFICATION_STORE) {
        chrome.storage.local.set({ NOTIFICATION_STORE: NOTIFICATION_MODEL });
      }
    });
  }

  async get(): Promise<NotificationType[]> {
    const { NOTIFICATION_STORE = [] } = (await chrome.storage.local.get()) as {
      NOTIFICATION_STORE: NotificationType[];
    };

    return NOTIFICATION_STORE;
  }

  async set(value: NotificationType) {
    const NOTIFICATION_STORE = await this.get();

    await chrome.storage.local.set({
      NOTIFICATION_STORE: [value, ...NOTIFICATION_STORE],
    });
  }

  async remove(i: number) {
    // remove data for url in NOTIFICATION_STORE
    const NOTIFICATION_STORE = await this.get();

    NOTIFICATION_STORE.splice(i, 1);

    await chrome.storage.local.set({ NOTIFICATION_STORE });
  }

  async checkTabFocused(
    document: Document,
    showMessage: (v: string) => void,
    showError: (v: string) => void,
  ) {
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

        await this.remove(i);
      }
    }
  }

  initTabFocusListener(
    document: Document,
    showMessage: (v: string) => void,
    showError: (v: string) => void,
  ) {
    // check if tab is focused and show notifications
    const runCheckTabFocused = async () => {
      this.checkTabFocused(document, showMessage, showError);
    };

    // init listener for tab focus
    document.addEventListener('visibilitychange', runCheckTabFocused);
  }
}

export const notificationStore = new NotificationStore();
