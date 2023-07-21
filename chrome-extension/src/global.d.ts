/* eslint-disable no-unused-vars */

type Progress = {
  current: number;
  max: number;
};

type Settings = {
  stars: boolean;
  forks: boolean;
  location: boolean;
  sample: boolean;
  samplePercent: number;
};

type RepoParams = {
  owner: string;
  name: string;
};

type LastStage = 'stargazers' | 'forks' | 'additional';

type Downloader = {
  id: null | string;
  active: boolean;
  stage: number;
  date: null | string | number | Date;
  url: string;
  name: string;
  progress: Progress;
  stargazers_count: number;
  stargazers_users: number;
  stargazers_users_data?: DBUser[];
  forks_count: number;
  forks_users: number;
  forks_users_data?: DBUser[];
  issues_count: number;
  pull_requests_count: number;
  watchers_count: number;
  contributors_count: number;
  octokitUrl: string;
  settings: Settings;
  issues_statistic?: IssuesStatistic;
  stars_history?: StarHistoryByMonth;
  prsMergedLTM?: number;
  lastStage?: LastStage;
  cursor?: string;
  restoreLimitsDate?: Date;
};

type HistoryType = Downloader[];

type CurrentUser = {
  uuid?: string;
  email?: string;
};

type NotificationType = {
  type: string;
  message: string;
};

type Mapper = (data: any[]) => any[];

type StargazerUserResponse = {
  repository: {
    stargazers: {
      edges: StargazerUser[];
      pageInfo: PageInfo;
    };
  };
  rateLimit: RateLimit;
};

type StargazerUser = {
  node: GithubUser;
};

type UserActivityNode = {
  node: {
    createdAt: Date;
  };
};

type RepositoryNode = {
  node: {
    name: string;
  };
};

type FollowerNode = {
  node: {
    login: string;
  };
};

type RateLimit = {
  cost: number;
  remaining: number;
  resetAt: Date;
};

type PageInfo = {
  endCursor: string;
  hasNextPage: boolean;
};

type UserResponse = StargazerUserResponse & ForkUserResponse;

type ForkUserResponse = {
  repository: {
    forks: {
      edges: ForkUser[];
      pageInfo: PageInfo;
    };
  };
  rateLimit: RateLimit;
};

type ForkUser = {
  node: {
    owner: GithubUser;
  };
};

type GithubUser = {
  createdAt: Date;
  updatedAt: Date;
  location: string | null;
  login: string;
  name: string | null;
  bio: string;
  company: string;
  email: string;
  isHireable: boolean;
  isSiteAdmin: boolean;
  twitterUsername: string;
  websiteUrl: string;
  __typename: string;
  followers: {
    totalCount: number;
  };
  following: {
    totalCount: number;
  };
};

type DBUser = {
  active_user: boolean;
  bio: string;
  blog: string;
  company: string;
  country: string;
  created_at: Date;
  email: string;
  event_count: number;
  followers: number;
  following: number;
  hireable: boolean;
  lat: number | null;
  location: string | null;
  login: string;
  lon: number | null;
  name: string | null;
  real_user: boolean;
  site_admin: boolean;
  twitter_username: string;
  type: string;
  updated_at: Date;
};

type IssuesResponse = {
  repository: {
    issues: {
      totalCount: number;
      edges: Issue[];
      pageInfo: PageInfo;
    };
  };
  rateLimit: RateLimit;
};

type Issue = {
  node: {
    createdAt: Date;
    closed: boolean;
    state: 'OPEN' | 'CLOSED';
    closedAt: Date | null;
  };
};

type ChartData = {
  [key: string]: {
    opened: number;
    closed: number;
  };
};

type IssuesStatistic = {
  chartData?: ChartData;
  health?: number;
  openedLTM?: number;
};

type PullRequestsResponse = {
  repository: {
    pullRequests: {
      totalCount: number;
      edges: PullRequest[];
      pageInfo: PageInfo;
    };
  };
  rateLimit: RateLimit;
};

type PullRequest = {
  node: {
    createdAt: Date;
    closed: boolean;
    state: 'OPEN' | 'CLOSED';
    closedAt: Date | null;
  };
};

type StarHistoryResponse = {
  repository: {
    stargazers: {
      totalCount: number;
      edges: StarHistory[];
      pageInfo: PageInfo;
    };
  };
  rateLimit: RateLimit;
};

type StarHistory = {
  starredAt: Date;
  node: {
    login: string;
  };
};

type StarHistoryByMonth = {
  [key: string]: {
    count: number;
    users: string[];
  };
};

type InspectData = {
  fork_users: DBUser[];
  issues: IssuesStatistic;
  pull_requests_merged_LTM: number;
  stargaze_users: DBUser[];
  stars_history: StarHistoryByMonth;
};
