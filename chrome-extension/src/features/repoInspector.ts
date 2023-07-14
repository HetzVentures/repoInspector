import { Octokit } from '@octokit/core';
import {
  getIssuesStatistic,
  getOctokitRepoData,
  groupStarsHistoryByMonth,
  initToken,
  serializeUser,
} from './utils';
import { initOctokit } from './octokit';
import {
  getForkersQuery,
  getStargazersQuery,
  issuesQuery,
  pullRequestsQuery,
  starHistoryQuery,
} from './queries';

import { STAGE, USERS_QUERY_LIMIT } from './store/models';
import { downloaderStore } from './store/downloader';
import { inspectDataStore } from './store/inspectData';
import { NOTIFICATION_TYPES, notificationStore } from './store/notification';
import { api } from './api';
import { auth } from './authentication';
import { historyStore } from './store/history';

let octokit: Octokit;

initToken().then((token) => {
  octokit = initOctokit(token);
});

class RepoInspector {
  async inspectAssets(downloader: Downloader) {
    const { url } = downloader;
    const { owner, name } = getOctokitRepoData(url);

    if (!owner || !name) {
      await this._stopByError();

      return;
    }

    await downloaderStore.setStage(STAGE.GETTING_ADDITIONAL_STATISTIC);

    const [issues, pull_request, star_history] = await Promise.all([
      await this.getIssues(owner, name),
      await this.getPullRequests(owner, name),
      await this.getStarHistory(owner, name),
    ]);

    await downloaderStore.setStage(STAGE.GETTING_USERS);

    const starred_users = downloader.settings?.stars
      ? await this.getStarredUsers(
          owner,
          name,
          USERS_QUERY_LIMIT,
          downloader.stargazers_users,
        )
      : { success: true };
    const fork_users = downloader.settings?.forks
      ? await this.getForkUsers(
          owner,
          name,
          USERS_QUERY_LIMIT,
          downloader.forks_users,
        )
      : { success: true };

    if (
      starred_users.success &&
      fork_users.success &&
      issues.success &&
      pull_request.success &&
      star_history.success
    ) {
      this._finishInspection();
    } else {
      // FIXME: think and add handler here
      console.log(
        'starred_users.success, fork_users.success, issues.success, pull_request.success, star_history.success',
        starred_users.success && fork_users.success,
        issues.success,
        pull_request.success,
        star_history.success,
      );
    }
  }

  async getStarredUsers(
    owner: string,
    name: string,
    limit: number,
    max: number,
    prev: any[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    let items: any[] = [...prev];

    const stargazersQuery = getStargazersQuery(limit);

    try {
      const resp: StargazerUserResponse = await octokit.graphql(
        stargazersQuery,
        {
          owner,
          name,
          cursor,
        },
      );

      const hasNextPage = resp?.repository?.stargazers?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.stargazers?.pageInfo.endCursor;
      const currentRequestItems = resp?.repository?.stargazers?.edges ?? [];

      // remove artifacts of graphQL response and normalize data
      const normalizedCurrentRequestItems = await Promise.all(
        currentRequestItems.map(async (item) => {
          const mappedItem: GithubUser = { ...item.node };

          if (!mappedItem.login) return {};

          const serializedItem = serializeUser(mappedItem, octokit);

          return serializedItem;
        }),
      );
      items = [...items, ...normalizedCurrentRequestItems];

      downloaderStore.increaseProgress();

      if (hasNextPage && items.length < max) {
        return await this.getStarredUsers(
          owner,
          name,
          USERS_QUERY_LIMIT,
          max,
          items,
          endCursor,
        );
      }
    } catch (error) {
      console.log('error: ', error);
    }

    inspectDataStore.set('stargaze_users', items);

    return { success: true };
  }

  async getForkUsers(
    owner: string,
    name: string,
    limit: number,
    max: number,
    prev: any[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    let items = [...prev];

    const forkersQuery = getForkersQuery(limit);

    try {
      const resp: ForkUserResponse = await octokit.graphql(forkersQuery, {
        owner,
        name,
        cursor,
      });

      const hasNextPage = resp?.repository?.forks?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.forks?.pageInfo.endCursor;
      const currentRequestItems = resp?.repository?.forks?.edges ?? [];

      // remove artifacts of graphQL response and normalize data
      const normalizedCurrentRequestItems = await Promise.all(
        currentRequestItems.map(async (item) => {
          const mappedItem: GithubUser = { ...item.node, ...item.node.owner };

          if (!mappedItem.login) return {};

          const serializedItem = serializeUser(mappedItem, octokit);

          return serializedItem;
        }),
      );
      items = [...items, ...normalizedCurrentRequestItems];

      downloaderStore.increaseProgress();

      if (hasNextPage && items.length < max) {
        return await this.getForkUsers(
          owner,
          name,
          USERS_QUERY_LIMIT,
          max,
          items,
          endCursor,
        );
      }
    } catch (error) {
      console.log('error: ', error);
    }

    inspectDataStore.set('fork_users', items);

    return { success: true };
  }

  async getStarHistory(
    owner: string,
    name: string,
    prev: StarHistory[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    let items: StarHistory[] = [...prev];

    try {
      const resp: StarHistoryResponse = await octokit.graphql(
        starHistoryQuery,
        {
          owner,
          name,
          cursor,
        },
      );

      const hasNextPage = resp?.repository?.stargazers?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.stargazers?.pageInfo.endCursor;
      items = [...items, ...(resp?.repository?.stargazers?.edges ?? [])];

      downloaderStore.increaseProgress();

      if (hasNextPage) {
        return await this.getStarHistory(owner, name, items, endCursor);
      }
    } catch (error) {
      console.log('error: ', error);
    }

    const stars_history = groupStarsHistoryByMonth(items);

    inspectDataStore.set('stars_history', stars_history);

    return { success: true };
  }

  async getIssues(
    owner: string,
    name: string,
    prev: Issue[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    let items: Issue[] = [...prev];

    try {
      const resp: IssuesResponse = await octokit.graphql(issuesQuery, {
        owner,
        name,
        cursor,
      });

      const hasNextPage = resp?.repository?.issues?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.issues?.pageInfo.endCursor;
      items = [...items, ...(resp?.repository?.issues?.edges ?? [])];

      downloaderStore.increaseProgress();

      if (hasNextPage) {
        return await this.getIssues(owner, name, items, endCursor);
      }
    } catch (error) {
      console.log('error: ', error);
    }

    const issues = getIssuesStatistic(items);

    inspectDataStore.set('issues', issues);

    return { success: true };
  }

  async getPullRequests(
    owner: string,
    name: string,
    prev: PullRequest[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    let items: PullRequest[] = [...prev];

    try {
      const resp: PullRequestsResponse = await octokit.graphql(
        pullRequestsQuery,
        {
          owner,
          name,
          cursor,
        },
      );

      const hasNextPage = resp?.repository?.pullRequests?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.pullRequests?.pageInfo.endCursor;
      items = [...items, ...(resp?.repository?.pullRequests?.edges ?? [])];

      downloaderStore.increaseProgress();

      if (hasNextPage) {
        return await this.getPullRequests(owner, name, items, endCursor);
      }
    } catch (error) {
      console.log('error: ', error);
    }

    const pull_requests = items.map(({ node }) => ({ ...node }));

    inspectDataStore.set('pull_requests', pull_requests);

    return { success: true };
  }

  async _stopByError() {
    notificationStore.set({
      type: NOTIFICATION_TYPES.ERROR,
      message: 'Please check repository URL',
    });

    inspectDataStore.refresh();
    await downloaderStore.reset();
  }

  async _finishInspection() {
    // on finish inspection we deactivate the interval and send the data to the server for packaging and emailing it.
    const downloader = await downloaderStore.get();

    const inspectData = inspectDataStore.inspectDataDb;
    const forks = inspectData.fork_users.filter(({ login }: any) => login);
    const stargazers = inspectData.stargaze_users.filter(
      ({ login }: any) => login,
    );
    const postData = {
      repository: downloader,
      forks,
      stargazers,
      issues: inspectData.issues,
      pull_requests: inspectData.pull_requests,
      stars_history: inspectData.stars_history,
    };

    try {
      const data = await api.post(
        `repository/?user_id=${auth.currentUser.uuid}`,
        postData,
      );

      downloader.stage = STAGE.DONE;
      downloader.id = data.id;
      downloader.stars_history = inspectData.stars_history;
      downloader.issues_statistic = inspectData.issues;

      notificationStore.set({
        type: NOTIFICATION_TYPES.SUCCESS,
        message: 'Nice! Your repo data has been sent to your email.',
      });
    } catch (error) {
      alert(error);
      downloader.stage = STAGE.ERROR;
    }

    // save data to history
    await historyStore.set(downloader);
    inspectDataStore.refresh();
    await downloaderStore.reset();
  }
}

export const repoInspector = new RepoInspector();
