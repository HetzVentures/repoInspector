import { downloaderStore } from '@/features/store/downloader';

const checkDownloadPage = async () => {
  chrome.tabs
    .query({
      url: 'chrome-extension://gpbbcpjccbhdjnjkpbmkbdhhlocpfbne/options.html',
    })
    .then(async (d) => {
      if (!d.length) {
        const downloader = await downloaderStore.get();

        if (downloader.active) {
          let { NOTIFICATION_STATE } = await chrome.storage.local.get([
            'NOTIFICATION_STATE',
          ]);

          if (NOTIFICATION_STATE) {
            NOTIFICATION_STATE = false;
            chrome.storage.local.set({ NOTIFICATION_STATE });
            const notificationId = new Date().getTime();
            chrome.notifications.create(`notification_${notificationId}`, {
              type: 'basic',
              iconUrl: 'images/icon48.png',
              title: 'Download has paused',
              message: 'Click the extension to continue downloading',
              priority: 2,
            });
          }
        }
      }

      const { FINISHED_REPO } = await chrome.storage.local.get([
        'FINISHED_REPO',
      ]);

      if (FINISHED_REPO) {
        await chrome.storage.local.remove(['FINISHED_REPO']);
        const notificationId = new Date().getTime();
        chrome.notifications.create(`notification_${notificationId}`, {
          type: 'basic',
          iconUrl: 'images/icon48.png',
          title: 'Inspection complete',
          message: 'Nice! Your repo data has been sent to your email.',
          priority: 2,
        });
      }
    });
};

chrome.runtime.onStartup.addListener(() => checkDownloadPage());

const initAlarm = () => {
  chrome.alarms.get('downloadPage', (a) => {
    if (!a) chrome.alarms.create('downloadPage', { periodInMinutes: 1.0 });
  });
};

chrome.runtime.onStartup.addListener(() => {
  initAlarm();
});

chrome.runtime.onInstalled.addListener(() => {
  initAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'downloadPage') {
    checkDownloadPage();
  }
});
