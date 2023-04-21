export const HISTORY_MODEL = [];

export const NOTIFICATION_MODEL = [];

export const DOWNLOADER_MODEL: Downloader = {
  id: null,
  active: false,
  stage: 0,
  date: null,
  url: "",
  octokitUrl: "",
  name: "",
  progress: {
    current: 0,
    max: 0,
  },
  stargazers_count: 0,
  forks_count: 0,
  settings: {
    stars: true,
    forks: false,
    sample: false,
    samplePercent: 0,
    location: true,
  },
};

export const USER_DB = {
  forks: {},
  forks_urls: [],
  stargazers: {},
  stargazers_urls: [],
  repo: "",
};

export const STAGE = {
  INITIATED: 0,
  GETTING_URLS: 1,
  GETTING_USERS: 2,
  DONE: 3,
  ERROR: 4,
};

export class Queue {
  items: {
    [key: number]: any;
  };
  headIndex: number;
  tailIndex: number;

  constructor() {
    this.items = {};
    this.headIndex = 0;
    this.tailIndex = 0;
  }

  enqueue(item: any) {
    this.items[this.tailIndex] = item;
    this.tailIndex++;
  }

  dequeue() {
    const item = this.items[this.headIndex];
    delete this.items[this.headIndex];
    this.headIndex++;
    return item;
  }

  peek() {
    return this.items[this.headIndex];
  }

  get length() {
    return this.tailIndex - this.headIndex;
  }
}
