import { Octokit } from '@octokit/core';

// Initialize octokit instance
const initOctokit = (accessToken: null | void | string) =>
  new Octokit({ auth: accessToken });

export { initOctokit };
