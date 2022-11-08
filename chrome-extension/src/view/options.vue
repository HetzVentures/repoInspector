<template>
      <div class="main_app">
        <main class="container">
        <Transition name="bounce">
          <div v-if="error" class="alert alert-danger float-bottom" role="alert">{{error}}</div>
        </Transition>
          <div class="header-margin"></div>
          <template v-for="urlKey of keys(urlStoreData)">
            <DownloadCard v-if="urlKey === currentRepo"
                      v-bind:key="urlKey"
                      v-bind:repoData="urlStoreData[urlKey]" 
                      v-bind:repoUrl="urlKey" 
                      v-bind:currentRepo="currentRepo"
                      @remove="(repo) => cancel = repo" />
          </template>
            <template v-for="urlKey of keys(urlStoreData)">
              <HistoryCard v-if="urlKey !== currentRepo"
                        v-bind:key="urlKey"
                        v-bind:repoData="urlStoreData[urlKey]" 
                        v-bind:repoUrl="urlKey" 
                        v-bind:currentRepo="currentRepo"
                        @remove="(repo) => cancel = repo" />
            </template>
          <dialog v-bind:open="cancel">
            <article>
              <h3>Delete Repo?</h3>
              <p>
                Are you sure you want to remove repo {{ cancel }}?
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
import {token, urlList, urlStoreData, urlQueue, currentRepo} from '@/entry/options'
import { auth } from '@/js/authentication'
import { repoInspector } from "@/js/repoInspector";
import { queueService } from '@/js/queue'

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
          logout: 0
    }
  },
  methods: {
    async refreshStore() {
        this.urlStoreData = await urlStore.all();
        this.currentRepo = await queueService.currentRepo();
        repoInspector.inspectAssets();
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
  },
    mounted() {
      setTimeout(()=>{
        queueService.continueFromSave();
      })
      setInterval(()=> {
        this.refreshStore();

      }, 5000)
    }
}

</script>

<style>

</style>
