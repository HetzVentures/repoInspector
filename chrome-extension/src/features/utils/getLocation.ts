const PHOTON_LOCATION_API_Q = 'https://photon.komoot.io/api/?limit=1&q=';

export const getLocation = async (location: string) => {
  // using a geocoding API, get location data for a given string
  const r = await fetch(`${PHOTON_LOCATION_API_Q}${location}`);

  return r.json();
};
