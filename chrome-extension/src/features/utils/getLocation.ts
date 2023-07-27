import Geonames from 'geonames.js';
import type { GeonamesInstance } from 'geonames.js/dist/geonames-types';
import { initGeoNamesLogin } from './initGeoNamesLogin';

let geonames: GeonamesInstance;

initGeoNamesLogin().then((geoNamesLoginData) => {
  if (!geoNamesLoginData.skipped && geoNamesLoginData.login) {
    geonames = Geonames({
      username: geoNamesLoginData.login,
      lan: 'en',
      encoding: 'JSON',
    });
  }
});

export const getLocation = async (location: string) => {
  if (geonames) {
    const r = await geonames.search({ q: location });

    return r.geonames;
  }

  return null;
};
