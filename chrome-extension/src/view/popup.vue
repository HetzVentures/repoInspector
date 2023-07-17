<script lang="ts">
import { initOctokit } from '@/features/octokit';
import { initialData } from '@/entry/popup';
import { auth } from '@/features/authentication';
import { downloaderStore } from '@/features/store/downloader';
import { historyStore } from '@/features/store/history';
import { STAGE, USERS_QUERY_LIMIT } from '@/features/store/models';
import {
  createName,
  getOctokitRepoData,
  getOwnTabs,
  octokitRepoUrl,
  timeout,
} from '@/features/utils';
import { repositoryQuery } from '@/features/queries';
import DownloadCard from './components/DownloadCard.vue';

interface PopupData {
  token: null | void | string;
  newToken: null | void | string;
  repoUrl: null | string;
  history: null | HistoryType;
  downloader: null | Downloader;
  cancel: 0 | string;
  error: null | string;
  loginPopup: null;
  currentUser: CurrentUser;
  showHistory: boolean;
  logout: 0 | 1;
  setupDelay: boolean;
}

export default {
  name: 'App',
  components: { DownloadCard },
  data(): PopupData {
    return {
      token: initialData.token,
      newToken: initialData.token,
      repoUrl: initialData.url,
      history: initialData.history,
      downloader: initialData.downloader,
      cancel: 0,
      error: null,
      loginPopup: null,
      currentUser: auth.currentUser,
      showHistory: false,
      logout: 0,
      setupDelay: true,
    };
  },
  async mounted() {
    // await downloaderStore.reset();

    // if current repo is being downloaded but download page has been shut down open it up
    if (this.downloader?.active) {
      const tab = await getOwnTabs();

      if (!tab.length) {
        chrome.runtime.openOptionsPage();
      }
    }

    setInterval(() => {
      this.refreshStore();
    }, 5000);

    this.currentUser = await auth.getStoredUser();

    // check if current user has logged in
    if (!this.currentUser?.email) {
      setInterval(async () => {
        this.currentUser = await auth.getStoredUser();
      }, 2000);

      setTimeout(() => {
        // this is used to prevent the "login" button from being pressed twice during initial login
        this.setupDelay = false;
      }, 2000);
    }
  },
  methods: {
    saveToken() {
      // save access token
      const githubInspectorToken = this.newToken;
      chrome.storage.local.set({ githubInspectorToken });
      this.token = this.newToken;
    },
    setSettings(
      k: 'stars' | 'forks' | 'location' | 'sample' | 'samplePercent',
      v: any,
    ) {
      if (this.downloader?.settings) {
        // @ts-ignore
        this.downloader.settings[k] = v;
        downloaderStore.set(this.downloader);
      }
    },

    async runInspect() {
      // collect initial data on repo and send message to background to start inspecting it.
      try {
        if (!this.repoUrl) {
          this.showError('You must enter a repo to inspect!');

          return;
        }

        if (
          !this.downloader?.settings?.forks &&
          !this.downloader?.settings?.stars
        ) {
          this.showError(
            'You must select if you want forks, stars or both (but not none)',
          );

          return;
        }

        if (
          this.downloader?.settings?.sample &&
          (this.downloader?.settings.samplePercent <= 0 ||
            this.downloader?.settings.samplePercent > 100)
        ) {
          this.showError('Please choose a sample percentage between 1 and 100');

          return;
        }

        const { owner, name } = getOctokitRepoData(this.repoUrl);

        if (!owner || !name) {
          this.showError('Please check repo URL!');

          return;
        }

        this.downloader.url = this.repoUrl;
        this.downloader.octokitUrl = octokitRepoUrl(this.downloader.url);

        const octokit = initOctokit(this.token);
        const result = await octokit.graphql(repositoryQuery, {
          owner,
          name,
        });

        const contributorsURL = `https://api.github.com/repos/${owner}/${name}/contributors`;
        const { data } = await octokit.request(`GET ${contributorsURL}`);
        const contributorsCount = data.length;

        // set the data for inspection based on the settings
        const { settings } = this.downloader;

        const {
          repository: {
            stargazerCount,
            stargazers: { totalCount: stargazerUsers },
            forkCount,
            forks: { totalCount: forkUsers },
            issues: { totalCount: issuesCount },
            pullRequests: { totalCount: pullRequestsCount },
            watchers: { totalCount: watchersCount },
          },
        } = result;

        // number of fork count and fork users may be different, so we use number of fork users
        // to limit number of requested users according to sample settings
        const forks_users = settings.sample
          ? Math.ceil(forkUsers * (settings.samplePercent / 100))
          : forkUsers;
        const stargazer_users = settings.sample
          ? Math.ceil(stargazerUsers * (settings.samplePercent / 100))
          : stargazerUsers;

        // Calculate total number of requests needed to collect all data
        const maxRequests =
          Math.ceil(issuesCount / 100) +
          Math.ceil(pullRequestsCount / 100) +
          Math.ceil(stargazerCount / 100) +
          (settings.stars ? Math.ceil(forks_users / USERS_QUERY_LIMIT) : 0) +
          (settings.forks ? Math.ceil(stargazer_users / USERS_QUERY_LIMIT) : 0);

        this.downloader.stargazers_count = stargazerCount;
        this.downloader.forks_count = forkCount;
        this.downloader.stargazers_users = settings.stars ? stargazer_users : 0;
        this.downloader.forks_users = settings.forks ? forks_users : 0;
        this.downloader.issues_count = issuesCount;
        this.downloader.pull_requests_count = pullRequestsCount;
        this.downloader.watchers_count = watchersCount;
        this.downloader.contributors_count = contributorsCount;
        this.downloader.name = createName(this.downloader.url);
        this.downloader.date = new Date().getTime();
        this.downloader.active = true;
        this.downloader.stage = STAGE.INITIATED;
        this.downloader.progress = {
          ...this.downloader.progress,
          max: maxRequests,
        };
        await downloaderStore.set(this.downloader);

        chrome.runtime.openOptionsPage();
      } catch (error: any) {
        this.showError('Something went wrong');

        console.error(error);
      }
    },

    openDownloads() {
      chrome.runtime.openOptionsPage();
    },

    async refreshStore() {
      this.downloader = await downloaderStore.get();
    },

    keys(data: any) {
      return Object.keys(data);
    },

    async cancelUrl() {
      await downloaderStore.reset();
      this.refreshStore();
      this.cancel = 0;
    },

    showError(error: string) {
      this.error = error;
      setTimeout(() => {
        this.error = null;
      }, 5000);
    },

    openLogin() {
      auth.loginWithGoogle();
    },

    async runLogout() {
      await downloaderStore.reset();
      await historyStore.reset();
      auth.logout();
      await timeout(500);
      window.close();
    },
  },
};
</script>

<template>
  <main class="container">
    <div id="app">
      <Transition name="bounce">
        <div v-if="error" class="alert alert-danger float-bottom" role="alert">
          {{ error }}
        </div>
      </Transition>
      <img class="header-margin" src="/images/popup-header.gif" />
      <div class="header-margin"></div>
      <template v-if="!token">
        <article>
          <header>Welcome to repoInspector!</header>
          repoInspector is the tool for extracting Github repo data using the
          open GitHub API. To begin, we'll need a GitHub access token from your
          GitHub Developer Settings. For instructions, click below.
          <footer>
            <a
              role="button"
              target="_blank"
              href="https://github.com/HetzVentures/repoInspector"
              class="outline"
              >Get started</a
            >
          </footer>
        </article>

        <label for="token">Access token</label>
        <input v-model="newToken" type="text" name="token" />
        <button :disabled="!newToken" @click="saveToken">Save</button>
      </template>
      <template v-else-if="!currentUser.email">
        <article>
          <header>Almost there!</header>
          Please login with your Gmail account below. You’ll get the results of
          your inspection via this email. Your email is <b>only</b> used to
          deliver your inspection results. The inspection is done on your
          computer, and we aggregate the data for you to send it directly to
          you.
          <footer>
            <button
              :aria-busy="setupDelay"
              :disabled="!currentUser?.uuid || setupDelay"
              @click="openLogin()"
            >
              Log in to Gmail
            </button>
            <svg
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
            >
              <path
                d="M5.65 12.477a.5.5 0 10-.3-.954l.3.954zm-3.648-2.96l-.484-.128-.254.968.484.127.254-.968zM9 14.5v.5h1v-.5H9zm.063-4.813l-.054-.497a.5.5 0 00-.299.852l.352-.354zM12.5 5.913h.5V5.91l-.5.002zm-.833-2.007l-.466-.18a.5.5 0 00.112.533l.354-.353zm-.05-2.017l.456-.204a.5.5 0 00-.319-.276l-.137.48zm-2.173.792l-.126.484a.5.5 0 00.398-.064l-.272-.42zm-3.888 0l-.272.42a.5.5 0 00.398.064l-.126-.484zM3.383 1.89l-.137-.48a.5.5 0 00-.32.276l.457.204zm-.05 2.017l.354.353a.5.5 0 00.112-.534l-.466.181zM2.5 5.93H3v-.002l-.5.002zm3.438 3.758l.352.355a.5.5 0 00-.293-.851l-.06.496zM5.5 11H6l-.001-.037L5.5 11zM5 14.5v.5h1v-.5H5zm.35-2.977c-.603.19-.986.169-1.24.085-.251-.083-.444-.25-.629-.49a4.8 4.8 0 01-.27-.402c-.085-.139-.182-.302-.28-.447-.191-.281-.473-.633-.929-.753l-.254.968c.08.02.184.095.355.346.082.122.16.252.258.412.094.152.202.32.327.484.253.33.598.663 1.11.832.51.168 1.116.15 1.852-.081l-.3-.954zm4.65-.585c0-.318-.014-.608-.104-.878-.096-.288-.262-.51-.481-.727l-.705.71c.155.153.208.245.237.333.035.105.053.254.053.562h1zm-.884-.753c.903-.097 1.888-.325 2.647-.982.78-.675 1.237-1.729 1.237-3.29h-1c0 1.359-.39 2.1-.892 2.534-.524.454-1.258.653-2.099.743l.107.995zM13 5.91a3.354 3.354 0 00-.98-2.358l-.707.706c.438.44.685 1.034.687 1.655l1-.003zm-.867-1.824c.15-.384.22-.794.21-1.207l-1 .025a2.12 2.12 0 01-.142.82l.932.362zm.21-1.207a3.119 3.119 0 00-.27-1.195l-.913.408c.115.256.177.532.184.812l1-.025zm-.726-.99c.137-.481.137-.482.136-.482h-.003l-.004-.002a.462.462 0 00-.03-.007 1.261 1.261 0 00-.212-.024 2.172 2.172 0 00-.51.054c-.425.091-1.024.317-1.82.832l.542.84c.719-.464 1.206-.634 1.488-.694a1.2 1.2 0 01.306-.03l-.008-.001a.278.278 0 01-.01-.002l-.006-.002h-.003l-.002-.001c-.001 0-.002 0 .136-.482zm-2.047.307a8.209 8.209 0 00-4.14 0l.252.968a7.209 7.209 0 013.636 0l.252-.968zm-3.743.064c-.797-.514-1.397-.74-1.822-.83a2.17 2.17 0 00-.51-.053 1.259 1.259 0 00-.241.03l-.004.002h-.003l.136.481.137.481h-.001l-.002.001-.003.001a.327.327 0 01-.016.004l-.008.001h.008a1.19 1.19 0 01.298.03c.282.06.769.23 1.488.694l.543-.84zm-2.9-.576a3.12 3.12 0 00-.27 1.195l1 .025a2.09 2.09 0 01.183-.812l-.913-.408zm-.27 1.195c-.01.413.06.823.21 1.207l.932-.362a2.12 2.12 0 01-.143-.82l-1-.025zm.322.673a3.354 3.354 0 00-.726 1.091l.924.38c.118-.285.292-.545.51-.765l-.708-.706zm-.726 1.091A3.354 3.354 0 002 5.93l1-.003c0-.31.06-.616.177-.902l-.924-.38zM2 5.93c0 1.553.458 2.597 1.239 3.268.757.65 1.74.88 2.64.987l.118-.993C5.15 9.09 4.416 8.89 3.89 8.438 3.388 8.007 3 7.276 3 5.928H2zm3.585 3.404c-.5.498-.629 1.09-.584 1.704L6 10.963c-.03-.408.052-.683.291-.921l-.705-.709zM5 11v3.5h1V11H5zm5 3.5V13H9v1.5h1zm0-1.5v-2.063H9V13h1z"
                fill="currentColor"
              ></path>
            </svg>
            Lost? Review instructions
            <a
              target="_blank"
              href="https://github.com/HetzVentures/repoInspector"
              >here</a
            >
          </footer>
        </article>
      </template>
      <template v-else>
        <input
          v-model="repoUrl"
          :placeholder="downloader?.active ? 'Scanning repo...' : 'Repo URL'"
          type="text"
          :disabled="downloader?.active"
          name="repoUrl"
        />

        <template v-if="downloader?.active">
          <DownloadCard
            class="mb-32"
            :downloader="downloader"
            @remove="() => (cancel = downloader?.url || 0)"
          />
        </template>
        <article v-if="!downloader?.active && !history?.length">
          <header>Ready to inspect!</header>
          Paste the repo URL in the Inspect field. Choose whether you’d like the
          default data (Only Stars) or another option from the menu below. Then
          click Inspect.
        </article>
        <article v-if="downloader !== null && !downloader.active">
          <header>Settings</header>
          <fieldset>
            <label for="stars">
              <input
                id="stars"
                v-model="downloader.settings.stars"
                type="checkbox"
                name="stars"
                role="switch"
                @change="setSettings('stars', downloader?.settings.stars)"
              />
              Get users who have <b>starred</b> the repo
            </label>
          </fieldset>
          <fieldset>
            <label for="forks">
              <input
                id="forks"
                v-model="downloader.settings.forks"
                type="checkbox"
                name="forks"
                role="switch"
                @change="setSettings('forks', downloader?.settings.forks)"
              />
              Get users who have <b>forked</b> the repo
            </label>
          </fieldset>
          <fieldset>
            <label for="sample">
              <input
                id="sample"
                v-model="downloader.settings.sample"
                type="checkbox"
                name="sample"
                role="switch"
                @change="setSettings('sample', downloader?.settings.sample)"
              />
              Get a % sample of this repo
              <em data-tooltip="Recommended for large repos">(?)</em>
            </label>
            <input
              v-if="downloader?.settings.sample"
              v-model="downloader.settings.samplePercent"
              class="percent-picker"
              :aria-invalid="
                0 >= downloader?.settings.samplePercent ||
                downloader?.settings.samplePercent > 100
              "
              type="number"
              min="1"
              max="100"
              placeholder="Sample percent"
              @change="
                setSettings('samplePercent', downloader?.settings.samplePercent)
              "
            />
          </fieldset>

          <footer>
            <svg
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
            >
              <path
                d="M5.65 12.477a.5.5 0 10-.3-.954l.3.954zm-3.648-2.96l-.484-.128-.254.968.484.127.254-.968zM9 14.5v.5h1v-.5H9zm.063-4.813l-.054-.497a.5.5 0 00-.299.852l.352-.354zM12.5 5.913h.5V5.91l-.5.002zm-.833-2.007l-.466-.18a.5.5 0 00.112.533l.354-.353zm-.05-2.017l.456-.204a.5.5 0 00-.319-.276l-.137.48zm-2.173.792l-.126.484a.5.5 0 00.398-.064l-.272-.42zm-3.888 0l-.272.42a.5.5 0 00.398.064l-.126-.484zM3.383 1.89l-.137-.48a.5.5 0 00-.32.276l.457.204zm-.05 2.017l.354.353a.5.5 0 00.112-.534l-.466.181zM2.5 5.93H3v-.002l-.5.002zm3.438 3.758l.352.355a.5.5 0 00-.293-.851l-.06.496zM5.5 11H6l-.001-.037L5.5 11zM5 14.5v.5h1v-.5H5zm.35-2.977c-.603.19-.986.169-1.24.085-.251-.083-.444-.25-.629-.49a4.8 4.8 0 01-.27-.402c-.085-.139-.182-.302-.28-.447-.191-.281-.473-.633-.929-.753l-.254.968c.08.02.184.095.355.346.082.122.16.252.258.412.094.152.202.32.327.484.253.33.598.663 1.11.832.51.168 1.116.15 1.852-.081l-.3-.954zm4.65-.585c0-.318-.014-.608-.104-.878-.096-.288-.262-.51-.481-.727l-.705.71c.155.153.208.245.237.333.035.105.053.254.053.562h1zm-.884-.753c.903-.097 1.888-.325 2.647-.982.78-.675 1.237-1.729 1.237-3.29h-1c0 1.359-.39 2.1-.892 2.534-.524.454-1.258.653-2.099.743l.107.995zM13 5.91a3.354 3.354 0 00-.98-2.358l-.707.706c.438.44.685 1.034.687 1.655l1-.003zm-.867-1.824c.15-.384.22-.794.21-1.207l-1 .025a2.12 2.12 0 01-.142.82l.932.362zm.21-1.207a3.119 3.119 0 00-.27-1.195l-.913.408c.115.256.177.532.184.812l1-.025zm-.726-.99c.137-.481.137-.482.136-.482h-.003l-.004-.002a.462.462 0 00-.03-.007 1.261 1.261 0 00-.212-.024 2.172 2.172 0 00-.51.054c-.425.091-1.024.317-1.82.832l.542.84c.719-.464 1.206-.634 1.488-.694a1.2 1.2 0 01.306-.03l-.008-.001a.278.278 0 01-.01-.002l-.006-.002h-.003l-.002-.001c-.001 0-.002 0 .136-.482zm-2.047.307a8.209 8.209 0 00-4.14 0l.252.968a7.209 7.209 0 013.636 0l.252-.968zm-3.743.064c-.797-.514-1.397-.74-1.822-.83a2.17 2.17 0 00-.51-.053 1.259 1.259 0 00-.241.03l-.004.002h-.003l.136.481.137.481h-.001l-.002.001-.003.001a.327.327 0 01-.016.004l-.008.001h.008a1.19 1.19 0 01.298.03c.282.06.769.23 1.488.694l.543-.84zm-2.9-.576a3.12 3.12 0 00-.27 1.195l1 .025a2.09 2.09 0 01.183-.812l-.913-.408zm-.27 1.195c-.01.413.06.823.21 1.207l.932-.362a2.12 2.12 0 01-.143-.82l-1-.025zm.322.673a3.354 3.354 0 00-.726 1.091l.924.38c.118-.285.292-.545.51-.765l-.708-.706zm-.726 1.091A3.354 3.354 0 002 5.93l1-.003c0-.31.06-.616.177-.902l-.924-.38zM2 5.93c0 1.553.458 2.597 1.239 3.268.757.65 1.74.88 2.64.987l.118-.993C5.15 9.09 4.416 8.89 3.89 8.438 3.388 8.007 3 7.276 3 5.928H2zm3.585 3.404c-.5.498-.629 1.09-.584 1.704L6 10.963c-.03-.408.052-.683.291-.921l-.705-.709zM5 11v3.5h1V11H5zm5 3.5V13H9v1.5h1zm0-1.5v-2.063H9V13h1z"
                fill="currentColor"
              ></path>
            </svg>
            Lost? Review instructions
            <a
              target="_blank"
              href="https://github.com/HetzVentures/repoInspector"
              >here</a
            >
          </footer>
        </article>
        <button
          :aria-busy="!!downloader?.active"
          :disabled="downloader?.active"
          @click="runInspect"
        >
          Inspect
        </button>
        <button class="outline" @click="openDownloads()">
          Inspection History
        </button>
        <button class="secondary outline mt-32" @click="logout = 1">
          Log out
        </button>
      </template>
      <dialog :open="!!cancel">
        <article>
          <h3>Stop inspecting this repo?</h3>
          <p>Are you sure you want to stop inspecting repo {{ cancel }}?</p>
          <footer>
            <button
              style="width: 40%"
              role="button"
              class="secondary"
              @click="cancel = 0"
            >
              Cancel
            </button>
            <button style="width: 40%" role="button" @click="cancelUrl()">
              Confirm
            </button>
          </footer>
        </article>
      </dialog>
      <dialog :open="!!logout">
        <article>
          <h3>Logout?</h3>
          <template v-if="!downloader?.active">
            <p>Are you sure you want to log out? All data will be deleted</p>
            <footer>
              <button
                style="width: 40%"
                role="button"
                class="secondary"
                @click="logout = 0"
              >
                Cancel
              </button>
              <button style="width: 40%" role="button" @click="runLogout()">
                Confirm
              </button>
            </footer>
          </template>
          <template v-else>
            <p>In order to log out, first stop your active inspections</p>
            <footer>
              <button
                style="width: 40%"
                role="button"
                class="secondary"
                @click="logout = 0"
              >
                Ok
              </button>
            </footer>
          </template>
        </article>
      </dialog>
    </div>
  </main>
</template>

<style>
html {
  width: 400px;
  height: 400px;
}
body {
  padding-bottom: 12px;
}
.header-margin {
  margin-top: 18px;
}
.mt-32 {
  margin-top: 32px;
}
.mb-32 {
  margin-bottom: 32px;
}
.percent-picker {
  margin-top: 12px;
  margin-bottom: 0;
}
</style>
