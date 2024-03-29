export const HISTORY_MODEL = [];

export const NOTIFICATION_MODEL = [];

export const DOWNLOADER_MODEL: Downloader = {
  id: null,
  active: false,
  stage: 0,
  date: null,
  url: '',
  octokitUrl: '',
  name: '',
  progress: {
    current: 0,
    max: 0,
  },
  stargazers_count: 0,
  stargazers_users: 0,
  forks_count: 0,
  forks_users: 0,
  issues_count: 0,
  pull_requests_count: 0,
  watchers_count: 0,
  contributors_count: 0,
  settings: {
    stars: true,
    forks: false,
    sample: false,
    samplePercent: 0,
    location: false,
  },
  totalRatingWeights: {
    starsWeight: 0.225,
    contributorsWeight: 0.2,
    starsGrowthWeight: 0.05,
    starsActivityWeight: 0.125,
    forksStarsWeight: 0.15,
    issuesOpenedLTMWeight: 0.05,
    issuesClosedLTMWeight: 0.05,
    PRMergedLTMWeight: 0.15,
  },
};

export const INSPECT_DATA_DB: InspectData = {
  fork_users: [],
  stargaze_users: [],
  issues: {},
  pull_requests_merged_LTM: 0,
  stars_history: {},
  lastMonthStars: 0,
};

export const STAGE = {
  NOT_STARTED: 0,
  INITIATED: 1,
  UNPAUSED: 2,
  GETTING_ADDITIONAL_STATISTIC: 3,
  GETTING_USERS: 4,
  DONE: 5,
  ERROR: 6,
  PAUSE: 7,
};
