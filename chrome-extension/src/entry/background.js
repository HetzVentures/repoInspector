import { queueService } from '@/js/queue'

const checkDownloadPage = async() => {
    chrome.tabs.query({"url": "chrome-extension://gpbbcpjccbhdjnjkpbmkbdhhlocpfbne/options.html"}).then(async(d) => {
    if (!d.length) {
        const currentRepo = await queueService.currentRepo();
        if (currentRepo) {
                chrome.notifications.create(currentRepo, {
                    type: 'basic',
                    iconUrl: 'images/icon48.png',
                    title: 'Download has paused',
                    message: 'Click the extension to continue downloading',
                    priority: 2
                });
            } 
        }     
    })

}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "downloadPage") {
        checkDownloadPage()
    }
});

chrome.alarms.create('downloadPage', {
	periodInMinutes: 1
});

