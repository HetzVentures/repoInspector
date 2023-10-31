import type { Octokit } from '@octokit/core';
import { getLocation } from './getLocation';

export const serializeUser = async (
  user: GithubUser,
  octokit: Octokit,
  isExtendLocation = false,
) => {
  const {
    bio,
    company,
    createdAt,
    email,
    isHireable,
    isSiteAdmin,
    location,
    login,
    name,
    twitterUsername,
    updatedAt,
    websiteUrl,
    __typename,
    followers,
    following,
  } = user;

  let event_count;
  let lastEventDate;

  try {
    // get user event count
    const eventsURL = `https://api.github.com/users/${login}`;
    const { data } = await octokit.request(
      `GET ${eventsURL}/events?per_page=100`,
    );

    event_count = data.length;
    lastEventDate = data.length && data[0]?.created_at;
  } catch (error) {
    console.log(error);
  }

  // define real users
  const real_user = event_count > 3 || followers?.totalCount > 3;

  // define active user
  const yearAgo = new Date(
    new Date().setFullYear(new Date().getFullYear() - 1),
  ).getTime();
  const active_user =
    event_count > 0 &&
    lastEventDate &&
    new Date(lastEventDate).getTime() > yearAgo;

  const serializedUser = {
    login,
    type: __typename,
    site_admin: isSiteAdmin,
    name,
    company,
    blog: websiteUrl,
    location,
    email,
    hireable: isHireable,
    bio,
    twitter_username: twitterUsername,
    followers: followers?.totalCount,
    following: following?.totalCount,
    created_at: createdAt,
    updated_at: updatedAt,
    country: '',
    lat: null,
    lon: null,
    event_count,
    real_user,
    active_user,
  };

  // get location data from the github location str
  if (location && isExtendLocation) {
    try {
      const locationData = await getLocation(location);

      serializedUser.country = locationData.features[0]?.properties?.country;
      serializedUser.lat = locationData.features[0]?.geometry?.coordinates[0];
      serializedUser.lon = locationData.features[0]?.geometry?.coordinates[1];
    } catch (error) {
      console.log(error);
    }
  }

  return serializedUser;
};
