export const initToken = () =>
  // fetch github token from memory
  new Promise<string | void>((resolve) => {
    chrome.storage.local.get(
      "githubInspectorToken",
      async ({ githubInspectorToken }) => {
        if (githubInspectorToken) {
          resolve(githubInspectorToken);
        }
        resolve();
      }
    );
  });
