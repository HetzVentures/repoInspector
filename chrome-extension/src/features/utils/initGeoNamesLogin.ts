export const initGeoNamesLogin = async () =>
  // fetch initGeoNamesLogin from chrome storage
  new Promise<GeoNamesLoginData>((resolve) => {
    chrome.storage.local.get('geoNamesLogin', async ({ geoNamesLogin }) => {
      if (geoNamesLogin) {
        resolve(geoNamesLogin);
      }

      resolve({ skipped: false, login: null });
    });
  });
