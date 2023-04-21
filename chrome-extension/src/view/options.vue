<script lang="ts">
import { initialData } from "@/entry/options";
import { repoInspector } from "@/features/repoInspector";
import { userUrlQueue } from "@/features/userUrlQueue";
import { downloaderStore } from "@/features/store/downloader";
import { STAGE } from "@/features/store/models";
import { historyStore } from "@/features/store/history";
import { notificationStore } from "@/features/store/notification";
import HistoryCard from "./components/HistoryCard.vue";
import DownloadCard from "./components/DownloadCard.vue";

const HISTORY_JUMPS = 10;

interface OptionsData {
  token: null | void | string;
  newToken: null | void | string;
  history: null | History;
  downloader: null | Downloader;
  cancel: 0 | string;
  error: null | string;
  message: null | string;
  historyJumps: number;
  historyMax: number;
  logout: 0;
}

export default {
  name: "OptionsView",
  components: { DownloadCard, HistoryCard },
  data(): OptionsData {
    return {
      token: initialData.token,
      newToken: initialData.token,
      history: initialData.history,
      downloader: initialData.downloader,
      cancel: 0,
      error: null,
      message: null,
      historyJumps: HISTORY_JUMPS,
      historyMax: HISTORY_JUMPS,
      logout: 0,
    };
  },
  mounted() {
    (async () => {
      if (this.downloader?.stage === STAGE.GETTING_URLS) {
        // if we stopped in the middle of collecting user urls, start again
        repoInspector.inspectAssets(this.downloader);
      }
      // if we stopped in the middle of inspecting a repos users, continue from where we saved
      else if (this.downloader?.stage === STAGE.GETTING_USERS) {
        const loadState = await userUrlQueue.loadQueueState();
        if (loadState) {
          userUrlQueue.continueFromSave();
        } else {
          // if we started getting users, but didn't save the state, start again
          repoInspector.inspectAssets(this.downloader);
        }
      }
    })();
    setInterval(() => {
      this.refreshStore();
    }, 5000);

    // set notification to show once window is closed
    const NOTIFICATION_STATE = true;
    chrome.storage.local.set({ NOTIFICATION_STATE });

    notificationStore.initTabFocusListener(
      document,
      this.showMessage,
      this.showError
    );
  },
  methods: {
    async refreshStore() {
      // this function refreshes the UI as well as checks to see if a new repo needs to be parsed. It runs
      // every 5 seconds
      this.history = await historyStore.get();
      this.downloader = await downloaderStore.get();

      if (
        this.downloader?.active &&
        this.downloader.stage === STAGE.INITIATED
      ) {
        // clean anything that may have been left over in the queue
        userUrlQueue.deactivateInterval();

        // start the download process
        this.downloader.stage = STAGE.GETTING_URLS;
        await downloaderStore.set(this.downloader);
        repoInspector.inspectAssets(this.downloader);
      }
      // check if the tab is focused for notifications
      notificationStore.checkTabFocused(
        document,
        this.showMessage,
        this.showError
      );
    },
    async cancelUrl() {
      await downloaderStore.reset();
      this.refreshStore();
      this.cancel = 0;
    },
    async removeUrl(i: number) {
      await historyStore.remove(i);
      this.refreshStore();
    },
    setError(error: string) {
      this.error = error;
    },
    showResult(result: boolean) {
      // show result of a repo being resent
      if (result) {
        this.showMessage("Repo resent successfully");
      } else {
        this.showError("Something went wrong. Please try again later.");
      }
    },
    showError(error: null | string) {
      // show error for 5 seconds
      this.error = error;

      setTimeout(() => {
        this.error = null;
      }, 5000);
    },
    showMessage(message: null | string) {
      // show message for 5 seconds
      this.message = message;
      setTimeout(() => {
        this.message = null;
      }, 5000);
    },
  },
};
</script>

<template>
  <div class="main_app">
    <main class="container">
      <Transition name="slide-fade">
        <div v-if="error" class="alert alert-danger float-bottom" role="alert">
          {{ error }}
        </div>
      </Transition>
      <Transition name="slide-fade">
        <div
          v-if="message"
          class="alert alert-success float-bottom"
          role="alert"
        >
          {{ message }}
        </div>
      </Transition>
      <img src="/images/repo-banner.gif" />
      <kbd v-if="downloader?.active" class="header-margin" aria-busy="true">
        Closing this page will stop the inspection
      </kbd>
      <template v-if="downloader?.active">
        <DownloadCard
          :downloader="downloader"
          @remove="() => (cancel = downloader?.url || '')"
        />
      </template>
      <template v-for="(repo, i) in history" :key="i">
        <HistoryCard
          v-if="+i < historyMax"
          :repo-data="repo"
          @remove="() => removeUrl(+i)"
          @resend="(result) => showResult(result)"
        />
      </template>
      <button
        v-if="historyMax < (history?.length || 0)"
        class="secondary outline load-more"
        @click="historyMax = historyMax + historyJumps"
      >
        Load more
      </button>
      <div class="mb-32"></div>
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
    </main>
  </div>
</template>

<style>
.header-margin {
  margin-top: 12px;
}
.load-more {
  max-width: 680px;
  margin: auto;
  margin-top: 32px;
}
.mb-32 {
  margin-bottom: 32px;
}
</style>
