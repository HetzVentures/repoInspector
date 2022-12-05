<template>
      <div class="main_app">
        <main class="container">
        <Transition name="bounce">
          <div v-if="error" class="alert alert-danger float-bottom" role="alert">{{error}}</div>
        </Transition>
          <img src="images/repo-banner.gif">
          <kbd class="header-margin" aria-busy="true" v-if="downloader.active">
                Closing this page will stop the inspection
          </kbd>
          <template v-if="downloader.active">
            <DownloadCard
                      v-bind:downloader="downloader"
                      @remove="() => cancel = downloader.url" />
          </template>
            <template v-for="(repo, i) in history" v-bind:key="i">
              <HistoryCard
                        v-if="i < historyMax"
                        v-bind:repoData="repo" 
                        @remove="() => removeUrl(i)" />
            </template>
            <button @click="historyMax = historyMax + historyJumps"
            class="secondary outline load-more" v-if="historyMax < history.length">Load more</button>
            <div class="mb-32"></div>
          <dialog v-bind:open="cancel">
            <article>
              <h3>Stop inspecting this repo?</h3>
              <p>
                Are you sure you want to stop inspecting repo {{ cancel }}?
              </p>
              <footer>
                    <button style="width: 40%" v-on:click="cancel = 0" role="button" class="secondary">Cancel</button>
                    <button style="width: 40%" v-on:click="cancelUrl()" role="button">Confirm</button>
              </footer>
            </article>
          </dialog>
        </main>
      </div>    
  </template>

<script>
import DownloadCard from './components/DownloadCard.vue'
import HistoryCard from './components/HistoryCard.vue'
import {token, history, downloader} from '@/entry/options'
import { repoInspector } from "@/js/repoInspector";
import { queueService } from '@/js/queue'
import { downloaderStore } from '@/js/store/downloader'
import { STAGE } from '@/js/store/models'
import { historyStore } from '@/js/store/history';

const HISTORY_JUMPS = 10;


export default {
  components: { DownloadCard, HistoryCard },
  name: 'optionsView',
  data () {
    return {
      token: token,
      newToken: token,
      downloader: downloader,
      cancel: 0,
      error: null,
      history: history,
      historyJumps: HISTORY_JUMPS,
      historyMax: HISTORY_JUMPS,
      logout: 0
    }
  },
  methods: {
    async refreshStore() {
        // this function refreshes the UI as well as checks to see if a new repo needs to be parsed. It runs
        // every 5 seconds
        this.history = await historyStore.get();
        this.downloader = await downloaderStore.get();
        if (this.downloader.active && this.downloader.stage === STAGE.INITIATED) {
          
          // clean anything that may have been left over in the queue
          queueService.deactivateInterval();
          
          // start the download process
          this.downloader.stage = STAGE.GETTING_URLS;
          await downloaderStore.set(this.downloader);
          repoInspector.inspectAssets(this.downloader);
        }
    },
    async cancelUrl() {
        await downloaderStore.reset();
        this.refreshStore();
        this.cancel = 0;
      },
      async removeUrl(i) {
        await historyStore.remove(i);
        this.refreshStore();
      },
  },
    mounted() {
      (async ()=> {
        if (downloader.stage === STAGE.GETTING_URLS) {
          // if we stopped in the middle of collecting user urls, start again
          repoInspector.inspectAssets(this.downloader);
        }
        // if we stopped in the middle of inspecting a repos users, continue from where we saved
        else if (downloader.stage === STAGE.GETTING_USERS) {
          const loadState = await queueService.loadQueueState();
          if (loadState) {
            queueService.continueFromSave()
          }
          else {
            // if we started getting users, but didn't save the state, start again
            repoInspector.inspectAssets(this.downloader);
          }
        }
      })()
      setInterval(()=> {
        this.refreshStore();
      }, 5000);

      // set notification to show once window is closed
      const NOTIFICATION_STATE = true;
      chrome.storage.local.set({ NOTIFICATION_STATE });
    }
}

</script>

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
