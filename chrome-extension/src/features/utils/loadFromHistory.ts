import { downloaderStore } from '../store/downloader';
import { inspectDataStore } from '../store/inspectData';
import { STAGE } from '../store/models';

export const loadFromHistory = async (downloader: Downloader) => {
  const {
    forks_users_data,
    stargazers_users_data,
    issues_statistic,
    stars_history,
    prsMergedLTM,
  } = downloader;

  const fork_users = forks_users_data?.length ? [...forks_users_data] : [];
  const stargaze_users = stargazers_users_data?.length
    ? [...stargazers_users_data]
    : [];

  const inspectData: InspectData = {
    fork_users,
    stargaze_users,
    issues: issues_statistic ?? {},
    stars_history: stars_history ?? {},
    pull_requests_merged_LTM: prsMergedLTM ?? 0,
  };

  inspectDataStore.load(inspectData);

  await downloaderStore.set({
    ...downloader,
    active: true,
    stage: STAGE.UNPAUSED,
    forks_users_data: [...fork_users],
    stargazers_users_data: [...stargaze_users],
  });

  return { success: true };
};
