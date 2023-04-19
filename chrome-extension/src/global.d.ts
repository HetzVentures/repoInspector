/* eslint-disable no-unused-vars */

interface Progress {
  current: number;
  max: number;
}

interface Settings {
  stars: boolean;
  forks: boolean;
  location: boolean;
  sample: boolean;
  samplePercent: number;
}

interface Downloader {
  id: null | string;
  active: boolean;
  stage: number;
  date: null | string | number | Date;
  url: string;
  name: string;
  progress: Progress;
  stargazers_count: number;
  forks_count: number;
  octokitUrl: string;
  settings: Settings;
}

type History = Downloader[];

type CurrentUser = {
  uuid?: string;
  email?: string;
};
