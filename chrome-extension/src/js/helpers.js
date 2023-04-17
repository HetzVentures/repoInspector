export const apiUrl = (url) => {
  // create base API url from github url if it has more parts than the base url
  // (for instance, if it is https://github.com/octokit/core.js/issues instead of https://github.com/octokit/core.js)
  const urlParts = url.split('/');
  return `/repos/${urlParts[3]}/${urlParts[4]}`;
};

export const initToken = () =>
  // fetch github token from memory
  new Promise((resolve) => {
    chrome.storage.local.get(
      'githubInspectorToken',
      async ({ githubInspectorToken }) => {
        if (githubInspectorToken) {
          resolve(githubInspectorToken);
        }
        resolve();
      },
    );
  });

export const initUrl = () =>
  // get current tab url if it is a github repo
  new Promise((resolve) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const { url } = tabs[0];
      resolve(url?.includes('https://github.com/') ? url : '');
    });
  });

export const timeout = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const popupCenter = ({ url, title, w, h }) => {
  // Fixes dual-screen position                             Most browsers      Firefox
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width =
    window.innerWidth || document.documentElement.clientWidth || screen.width;
  const height =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    screen.height;

  const systemZoom = width / window.screen.availWidth;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    `
    scrollbars=yes,
    width=${w / systemZoom},
    height=${h / systemZoom},
    top=${top},
    left=${left}
    `,
  );

  if (window.focus) newWindow.focus();
  return newWindow;
};

// check if download tab is open
export const getOwnTabs = () =>
  Promise.all(
    chrome.extension
      .getViews({ type: 'tab' })
      .map(
        (view) =>
          new Promise((resolve) =>
            view.chrome.tabs.getCurrent((tab) =>
              resolve(Object.assign(tab, { url: view.location.href })),
            ),
          ),
      ),
  );

export const createName = (repo) => {
  // remove any parts of url beyond repo name
  const urlParts = repo.split('/');
  return `${urlParts[3]}/${urlParts[4]}`;
};

export const octokitRepoUrl = (repo) =>
  // get repo name for octokit
  `/repos/${createName(repo)}`;
