import { RepoInspector } from "@/js/repoInspector.js";
import { queueService } from '@/js/queue.js'

// background.js
const repoInspector = new RepoInspector()
export const runInspector = () => repoInspector.inspectAssets();

// listen for Chrome starting
chrome.runtime.onStartup.addListener(() => repoInspector.inspectAssets());

// receive messages from popover
chrome.runtime.onMessage.addListener(
    (request) => {
        if (request.msg === 'inspectRepo') {
            runInspector();
        }
    }
);


const initAlarm = () => {
    chrome.alarms.get('periodic', a => {
        if (!a) chrome.alarms.create('periodic', { periodInMinutes: 1.0 });
      });
}
chrome.runtime.onStartup.addListener(() => {
    initAlarm()
  });

chrome.runtime.onInstalled.addListener(() => {
    initAlarm()
});

chrome.alarms.onAlarm.addListener(() => {
    queueService.continueFromSave();
});