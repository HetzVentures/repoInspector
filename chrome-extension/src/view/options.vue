<template>
      <div class="main_app">
        <main class="container">
        <Transition name="bounce">
          <div v-if="error" class="alert alert-danger float-bottom" role="alert">{{error}}</div>
        </Transition>
          <img src="images/repo-banner.gif">
          <kbd class="header-margin" aria-busy="true" v-if="currentRepo">
                Closing this page will stop the inspection
          </kbd>
          <template v-if="currentRepo && urlStoreData[currentRepo]">
            <DownloadCard
                      v-bind:repoData="urlStoreData[currentRepo]" 
                      v-bind:repoUrl="currentRepo" 
                      @remove="(repo) => cancel = repo" />
          </template>
            <template v-for="i in historyMax" v-bind:key="i">
              <HistoryCard
                        v-bind:repoData="history[i]?.data" 
                        v-bind:repoUrl="history[i]?.url" 
                        @remove="(i) => removeUrl(i)" />
            </template>
            <button @click="historyMax = historyMax + Math.min(historyJumps, history.length - historyMax - 1)"
            class="secondary outline load-more" v-if="historyMax < history.length - 1">Load more</button>
            <div class="mb-32"></div>
          <dialog v-bind:open="cancel">
            <article>
              <h3>Stop Repo?</h3>
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
        <!-- This input is a hack to prevent closing the window with a prompt -->
        <input v-model="currentRepo" style="display: none">
      </div>    
  </template>

<script>
import { urlStore } from '@/js/store'
import DownloadCard from './components/DownloadCard.vue'
import HistoryCard from './components/HistoryCard.vue'
import {token, urlList, urlStoreData, urlQueue, currentRepo, history} from '@/entry/options'
import { auth } from '@/js/authentication'
import { repoInspector } from "@/js/repoInspector";
import { queueService } from '@/js/queue'

const HISTORY_JUMPS = 10;

export default {
  components: { DownloadCard, HistoryCard },
  name: 'optionsView',
  data () {
    return {
      token: token,
          newToken: token,
          summary: {
            stargazers_count: 0,
            forks: 0
          },
          showSummary: false,
          urlList: urlList,
          urlStoreData: urlStoreData,
          urlQueue: urlQueue,
          cancel: 0,
          error: null,
          loginPopup: null,
          currentUser: auth.currentUser,
          currentRepo: currentRepo,
          history: history,
          historyJumps: HISTORY_JUMPS,
          historyMax: Math.min(HISTORY_JUMPS, history.length - 1),
          logout: 0
    }
  },
  methods: {
    async refreshStore() {
        // this function refreshes the UI as well as checks to see if a new repo needs to be parsed. It runs
        // every 5 seconds
        this.urlStoreData = await urlStore.all();
        this.history = await urlStore.getHistory();
        this.currentRepo = await queueService.currentRepo();
    },
    async refreshNewRepo() {
      const newRepo = await urlStore.newRepo();
        // only start parsing if we are working on a new repo
        if (newRepo) {
          await urlStore.clearNewRepo();
          repoInspector.inspectAssets(newRepo);
        }
    },
    keys(data) {
      if (data) {
        return Object.keys(data)
      }
      return []
    },
    cancelUrl() {
        this.currentRepo = null;
        urlStore.delete(this.cancel).then(()=> {this.refreshStore()});
        this.cancel = 0;
      },
      async removeUrl(i) {
        await urlStore.removeHistory(i);
        this.refreshStore();
      },
  },
    mounted() {
      (async ()=> {
        // if we stopped in the middle of inspecting a repos users, continue from where we saved
        const loadState = await queueService.loadQueueState();
        if (loadState) {
          queueService.continueFromSave()
        }
        // if we stopped in the middle of collecting user urls, start again
        else if (this.currentRepo) {
          repoInspector.inspectAssets(this.currentRepo);
        }
      })()
      setInterval(()=> {
        this.refreshStore();
      }, 5000);
      setInterval(()=> {
        this.refreshNewRepo();
      }, 5000);
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
