import { createName } from './createName';

export const octokitRepoUrl = (repo: string) =>
  // get repo name for octokit
  `/repos/${createName(repo)}`;
