export const initUrl = () =>
  // get current tab url if it is a github repo
  new Promise<string>((resolve) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const { url } = tabs[0];
      resolve(url?.includes('https://github.com/') ? url : '');
    });
  });
