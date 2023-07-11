// check if download tab is open
export const getOwnTabs = () =>
  Promise.all(
    chrome.extension.getViews({ type: 'tab' }).map(
      (view) =>
        new Promise((resolve) => {
          view.chrome.tabs.getCurrent((tab) =>
            resolve(Object.assign(tab || {}, { url: view.location.href })),
          );
        }),
    ),
  );
