const NOMINATIM_LOCATION_API_Q =
  'https://nominatim.openstreetmap.org/search.php?format=jsonv2&addressdetails=1&q=';

export const getLocation = async (location: string) => {
  // using a geocoding API, get location data for a given string
  const r = await fetch(`${NOMINATIM_LOCATION_API_Q}${location}`);

  return r.json();
};
