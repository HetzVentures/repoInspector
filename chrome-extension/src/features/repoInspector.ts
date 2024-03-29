import { Octokit } from '@octokit/core';
import {
  getForkersQuery,
  getStargazersQuery,
  issuesQuery,
  pullRequestsQuery,
  starHistoryQuery,
} from '@/features/gql/queries';
import type {
  GetForkersQueryQuery,
  GetStargazersQueryQuery,
  IssuesQueryQuery,
  PullRequestsQueryQuery,
  StarHistoryQueryQuery,
} from '@/features/gql/graphql.schema';
import {
  getIssuesStatistic,
  getOctokitRepoData,
  getPullRequestStatistic,
  groupStarsHistoryByMonth,
  initToken,
  serializeUser,
} from './utils';
import { initOctokit } from './octokit';

import { STAGE } from './store/models';
import { downloaderStore } from './store/downloader';
import { inspectDataStore } from './store/inspectData';
import { NOTIFICATION_TYPES, notificationStore } from './store/notification';
import { api } from './api';
import { auth } from './authentication';
import { historyStore } from './store/history';
import { MINIMUM_REQUEST_LIMIT_AMOUNT, USERS_QUERY_LIMIT } from './constants';
import { calculateTotalRating } from './utils/calculateTotalRating';

let octokit: Octokit;

initToken().then((token) => {
  octokit = initOctokit(token);
});

class RepoInspector {
  // used for prevent double recording current inspection state to local store when query limit reached
  alreadyPaused: boolean;

  constructor() {
    this.alreadyPaused = false;
  }

  async inspectAssets(downloader: Downloader) {
    const { url, stage, lastStage } = downloader;

    // If there are no inspections running, do nothing.
    if (stage < STAGE.INITIATED || stage > STAGE.GETTING_USERS) return;

    const { owner, name } = getOctokitRepoData(url);

    // if we can't receive owner or name of repository, do nothing
    if (!owner || !name) {
      await this._stopByError('Please check repository URL');

      return;
    }

    this.alreadyPaused = false;
    // check if it is new inspection or we continue previous one which was paused
    let isUnpaused = stage === STAGE.UNPAUSED;
    const isInitiated = stage === STAGE.INITIATED;

    if (isInitiated) inspectDataStore.refresh();

    if (lastStage === 'additional' || isInitiated) {
      await downloaderStore.setStage(STAGE.GETTING_ADDITIONAL_STATISTIC);
      isUnpaused = false;

      // Promise.all allows us to make paralleled requests for faster responses
      await Promise.all([
        await this.getIssues(owner, name),
        await this.getPullRequests(owner, name),
        await this.getStarHistory(owner, name),
      ]);
    }

    await downloaderStore.setStage(STAGE.GETTING_USERS);

    // if it is new inspection or if it was paused on stage getting stargazers
    if (!isUnpaused || lastStage === 'stargazers') {
      if (downloader.settings?.stars) {
        await this.getUsers(
          owner,
          name,
          'stargazers',
          USERS_QUERY_LIMIT,
          downloader.stargazers_users,
          downloader.settings.location,
          downloader.stargazers_users_data ?? [],
          downloader.cursor,
        );
      }

      if (downloader.settings?.forks) {
        await this.getUsers(
          owner,
          name,
          'forks',
          USERS_QUERY_LIMIT,
          downloader.forks_users,
          downloader.settings.location,
        );
      }
    }

    // only if it was paused on stage getting forkers
    if (isUnpaused && lastStage === 'forks' && downloader.settings?.forks) {
      await this.getUsers(
        owner,
        name,
        'forks',
        USERS_QUERY_LIMIT,
        downloader.forks_users,
        downloader.settings.location,
        downloader.forks_users_data,
        downloader.cursor,
      );
    }

    if (!this.alreadyPaused) {
      this._finishInspection();
    }
  }

  async getUsers(
    owner: string,
    name: string,
    type: 'stargazers' | 'forks',
    limit: number,
    max: number,
    isExtendLocation: boolean,
    prev: DBUser[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    const downloader = await downloaderStore.get();
    if (!downloader.active) return { success: false };

    let items: any[] = [...prev];

    const query = type === 'stargazers' ? getStargazersQuery : getForkersQuery;

    const inspectDataPropertyName =
      type === 'stargazers' ? 'stargaze_users' : 'fork_users';

    try {
      const resp = await octokit.graphql<
        GetForkersQueryQuery & GetStargazersQueryQuery
      >(query, {
        owner,
        name,
        cursor,
        limit,
      });

      const hasNextPage = resp?.repository?.[type].pageInfo.hasNextPage;
      const endCursor = resp?.repository?.[type].pageInfo.endCursor;
      const currentRequestItems = resp?.repository?.[type].edges ?? [];
      const requestRemaining = resp?.rateLimit?.remaining;

      // remove artifacts of graphQL response and normalize data
      const normalizedCurrentRequestItems = await Promise.all(
        currentRequestItems.map(async (item) => {
          const mappedItem: GithubUser =
            type === 'stargazers'
              ? { ...(item as StargazerUser)?.node }
              : { ...(item as ForkUser)?.node?.owner };

          if (!mappedItem.login) return {};

          const serializedItem = serializeUser(
            mappedItem,
            octokit,
            isExtendLocation,
          );

          return serializedItem;
        }),
      );
      items = [...items, ...normalizedCurrentRequestItems];

      downloaderStore.increaseProgress();

      // if query limits reached - pause inspection
      if (
        requestRemaining &&
        requestRemaining <= MINIMUM_REQUEST_LIMIT_AMOUNT
      ) {
        await inspectDataStore.set(inspectDataPropertyName, items as DBUser[]);
        this._pauseInspection(type, resp?.rateLimit?.resetAt, endCursor);

        return { success: false };
      }

      // if there are more data than we already receive - request for new portion of data
      if (hasNextPage && items.length < max) {
        return await this.getUsers(
          owner,
          name,
          type,
          USERS_QUERY_LIMIT,
          max,
          isExtendLocation,
          items,
          endCursor,
        );
      }
    } catch (error) {
      await this._stopByError();
    }

    // save collected users to global store
    inspectDataStore.set(inspectDataPropertyName, items as DBUser[]);

    return { success: true };
  }

  async getStarHistory(
    owner: string,
    name: string,
    prev: StarHistory[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    const downloader = await downloaderStore.get();
    if (!downloader.active) return { success: false };

    let items: StarHistory[] = [...prev];

    try {
      const resp = await octokit.graphql<StarHistoryQueryQuery>(
        starHistoryQuery,
        {
          owner,
          name,
          cursor,
        },
      );

      const hasNextPage = resp?.repository?.stargazers?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.stargazers?.pageInfo.endCursor;
      const responseItems =
        resp?.repository?.stargazers?.edges?.filter(Boolean) ?? [];
      items = [...items, ...(responseItems as StarHistory[])];
      const requestRemaining = resp?.rateLimit?.remaining;

      // if query limits reached - pause inspection
      if (
        requestRemaining &&
        requestRemaining <= MINIMUM_REQUEST_LIMIT_AMOUNT
      ) {
        this._pauseInspection('additional', resp?.rateLimit?.resetAt);

        return { success: false };
      }

      downloaderStore.increaseProgress();

      // if there are more data than we already receive - request for new portion of data
      if (hasNextPage) {
        return await this.getStarHistory(owner, name, items, endCursor);
      }
    } catch (error) {
      await this._stopByError();
    }

    const { stars_history, lastMonthStars } = groupStarsHistoryByMonth(items);

    // save collected users to global store
    inspectDataStore.set('stars_history', stars_history);
    inspectDataStore.set('lastMonthStars', lastMonthStars);

    return { success: true };
  }

  async getIssues(
    owner: string,
    name: string,
    prev: Issue[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    const downloader = await downloaderStore.get();
    if (!downloader.active) return { success: false };

    let items: Issue[] = [...prev];

    try {
      const resp = await octokit.graphql<IssuesQueryQuery>(issuesQuery, {
        owner,
        name,
        cursor,
      });

      const hasNextPage = resp?.repository?.issues?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.issues?.pageInfo.endCursor;
      items = [
        ...items,
        ...((resp?.repository?.issues?.edges?.filter(Boolean) as Issue[]) ??
          []),
      ];
      const requestRemaining = resp?.rateLimit?.remaining;

      // if query limits reached - pause inspection
      if (
        requestRemaining &&
        requestRemaining <= MINIMUM_REQUEST_LIMIT_AMOUNT
      ) {
        this._pauseInspection('additional', resp?.rateLimit?.resetAt);

        return { success: false };
      }

      downloaderStore.increaseProgress();

      // if there are more data than we already receive - request for new portion of data
      if (hasNextPage) {
        return await this.getIssues(owner, name, items, endCursor);
      }
    } catch (error) {
      await this._stopByError();
    }

    const issues = getIssuesStatistic(items);

    // save collected users to global store
    inspectDataStore.set('issues', issues);

    return { success: true };
  }

  async getPullRequests(
    owner: string,
    name: string,
    prev: PullRequest[] = [],
    cursor: null | string = null,
  ): Promise<{ success: boolean }> {
    const downloader = await downloaderStore.get();
    if (!downloader.active) return { success: false };

    let items: PullRequest[] = [...prev];

    try {
      const resp = await octokit.graphql<PullRequestsQueryQuery>(
        pullRequestsQuery,
        {
          owner,
          name,
          cursor,
        },
      );

      const hasNextPage = resp?.repository?.pullRequests?.pageInfo.hasNextPage;
      const endCursor = resp?.repository?.pullRequests?.pageInfo.endCursor;
      items = [
        ...items,
        ...((resp?.repository?.pullRequests?.edges?.filter(
          Boolean,
        ) as PullRequest[]) ?? []),
      ];
      const requestRemaining = resp?.rateLimit?.remaining;

      // if query limits reached - pause inspection
      if (
        requestRemaining &&
        requestRemaining <= MINIMUM_REQUEST_LIMIT_AMOUNT
      ) {
        this._pauseInspection('additional', resp?.rateLimit?.resetAt);

        return { success: false };
      }

      downloaderStore.increaseProgress();

      // if there are more data than we already receive - request for new portion of data
      if (hasNextPage) {
        return await this.getPullRequests(owner, name, items, endCursor);
      }
    } catch (error) {
      await this._stopByError();
    }

    const prsMergedLTM = getPullRequestStatistic(items);

    // save collected users to global store
    inspectDataStore.set('pull_requests_merged_LTM', prsMergedLTM);

    return { success: true };
  }

  async _stopByError(message?: string) {
    const errorMessage =
      message || 'Something went wrong. Please start from begin';

    notificationStore.set({
      type: NOTIFICATION_TYPES.ERROR,
      message: errorMessage,
    });

    inspectDataStore.refresh();
    await downloaderStore.reset();
  }

  async _finishInspection() {
    // on finish inspection we send the data to the server for packaging and emailing it.
    const downloader = await downloaderStore.get();

    const inspectData = inspectDataStore.inspectDataDb;
    const forks = inspectData.fork_users.filter(({ login }) => login);
    const stargazers = inspectData.stargaze_users.filter(({ login }) => login);
    const postData = {
      repository: {
        ...downloader,
        issues: inspectData.issues,
        pull_requests_merged_LTM: inspectData.pull_requests_merged_LTM,
        stars_history: inspectData.stars_history,
        last_month_stars: inspectData.lastMonthStars,
        total_rating: 0,
      },
      forks,
      stargazers,
    };

    const dataForRating: DataForRating = {
      stars: postData.repository.stargazers_count,
      contributors: postData.repository.contributors_count,
      starsGrowth:
        ((postData.repository.lastMonthStars ?? 0) /
          postData.repository.stargazers_count) *
        100,
      starsActivity:
        postData.repository.stargazers_count /
        Object.keys(postData.repository?.stars_history ?? []).length,
      forksStars:
        postData.repository.forks_count / postData.repository.stargazers_count,
      issuesOpenedLTM: postData.repository.issues.openedLTM ?? 0,
      issuesClosedLTM: postData.repository.issues.closedLTM ?? 0,
      pmMergedLTM: postData.repository.pull_requests_merged_LTM ?? 0,
    };

    postData.repository.total_rating = calculateTotalRating(
      dataForRating,
      downloader.totalRatingWeights,
    );

    try {
      const data = await api.post(
        `repository/?user_id=${auth.currentUser.uuid}`,
        postData,
      );

      downloader.stage = STAGE.DONE;
      downloader.id = data.id;
      downloader.stars_history = inspectData.stars_history;
      downloader.issues_statistic = inspectData.issues;
      downloader.prsMergedLTM = inspectData.pull_requests_merged_LTM;
      downloader.lastMonthStars = inspectData.lastMonthStars;
      downloader.total_rating = postData.repository.total_rating;

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

  async _pauseInspection(
    lastStage: LastStage,
    restoreLimitsDate: Date,
    cursor?: string | null,
  ) {
    // for now we use pause if github API request limits are reached
    const downloader = await downloaderStore.get();

    if (!this.alreadyPaused) {
      this.alreadyPaused = true;
      const inspectData = inspectDataStore.inspectDataDb;

      downloader.stage = STAGE.PAUSE;
      downloader.lastStage = lastStage;
      downloader.cursor = cursor;
      downloader.restoreLimitsDate = restoreLimitsDate;
      downloader.stars_history = inspectData.stars_history;
      downloader.issues_statistic = inspectData.issues;
      downloader.stargazers_users_data = inspectData.stargaze_users;
      downloader.forks_users_data = inspectData.fork_users;
      downloader.prsMergedLTM = inspectData.pull_requests_merged_LTM;

      // save data to history
      await historyStore.set(downloader);
      inspectDataStore.refresh();
      await downloaderStore.reset();

      notificationStore.set({
        type: NOTIFICATION_TYPES.ERROR,
        message: `Queries limit reached. Try after ${new Date(
          restoreLimitsDate,
        ).toLocaleTimeString()}`,
      });
    }
  }
}

export const repoInspector = new RepoInspector();
