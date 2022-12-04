
export const HISTORY_MODEL = [];

export const DOWNLOADER_MODEL = {
    active: false,
    stage: 0,
    date: null,
    url: '',
    octokitUrl: '',
    name: '',
    progress: {
        current: 0,
        max: 0
    },
    stargazers_count: 0,
    forks_count: 0,
    settings: {
        stars: true,
        forks: false,
        sample: false,
        samplePercent: 0,
        location: true
    }
}

export const USER_DB = {
    forks: {},
    forks_urls: [],
    stargazers: {},
    stargazers_urls: [],
    repo: ''
}

export const STAGE = {
    INITIATED: 0,
    GETTING_URLS: 1,
    GETTING_USERS: 2,
    DONE: 3,
    ERROR: 4,
  };