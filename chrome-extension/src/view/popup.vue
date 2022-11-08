<template>

  <main class="container">
      <div id="app">
        <Transition name="bounce">
          <div v-if="error" class="alert alert-danger float-bottom" role="alert">{{error}}</div>
        </Transition>
          <div class="header-margin"></div>
          <template v-if="!token">
              <label for="token">Access token</label>
              <input type="text" v-model="newToken" name="token">
              <button v-bind:disabled="!newToken" v-on:click="save">Save</button>
          </template>
          <button v-else-if="!currentUser.email" v-on:click="openLogin()">Login</button>
          <template v-else>
              <input v-bind:placeholder="currentRepo ? 'Scanning repo...' : 'Repo URL'" type="text" v-bind:disabled="currentRepo" v-model="repoUrl" name="repoUrl">
              <button v-bind:aria-busy="!!currentRepo" v-bind:disabled="currentRepo" v-on:click="runInspect">Inspect</button>
              
              <template v-for="urlKey of keys(urlStoreData)">
                <DownloadCard v-if="urlKey === currentRepo"
                          v-bind:key="urlKey"
                          v-bind:repoData="urlStoreData[urlKey]" 
                          v-bind:repoUrl="urlKey" 
                          v-bind:currentRepo="currentRepo"
                          @remove="(repo) => cancel = repo" />
              </template>
              <button v-if="keys(urlStoreData).length > 1 || keys(urlStoreData).length === 1 && !currentRepo" @click="showHistory = !showHistory">
                History
              </button>
              <template  v-if="showHistory">
                <template v-for="urlKey of keys(urlStoreData)">
                  <HistoryCard v-if="urlKey !== currentRepo"
                            v-bind:key="urlKey"
                            v-bind:repoData="urlStoreData[urlKey]" 
                            v-bind:repoUrl="urlKey" 
                            v-bind:currentRepo="currentRepo"
                            @remove="(repo) => cancel = repo" />
                </template>
              </template>
              <details role="list">
                <summary aria-haspopup="listbox">Tools</summary>
                <ul role="listbox">
                  <li><a @click="token = 0">Change Token</a></li>
                  <li><a @click="logout = 1">Logout</a></li>
                </ul>
              </details>

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
          <dialog v-bind:open="logout">
            <article>
              <h3>Logout?</h3>
              <p>
                Are you sure you want to log out? All data will be deleted
              </p>
              <footer>
                    <button style="width: 40%" v-on:click="logout = 0" role="button" class="secondary">Cancel</button>
                    <button style="width: 40%" v-on:click="runLogout()" role="button">Confirm</button>
              </footer>
            </article>
          </dialog>
      </div>
  
  </main>
  
    
  </template>
  
  <script>
  import DownloadCard from './components/DownloadCard.vue'
  import HistoryCard from './components/HistoryCard.vue'
  import { urlStore } from '@/js/store'
  import {initOctokit} from '@/js/octokit'
  import {token, url, urlList, urlStoreData, urlQueue, currentRepo} from '@/entry/popup'
  import { auth } from '@/js/authentication'
  import { queueService } from '@/js/queue'
  import { timeout } from '@/js/helpers'

  export default {
      components: { DownloadCard, HistoryCard },
      name: 'App',
      data() {
        return {
          token: token,
          newToken: token,
          repoUrl: url,
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
          showHistory: false,
          logout: 0
        }
      },
      methods: {
        save() {
          // save access token
            let githubInspectorToken = this.newToken;
            chrome.storage.local.set({ githubInspectorToken });
            this.token = this.newToken;
        },
        cleanRepoUrl() {
          // get repo name for octokit
            return `/repos/${this.createName()}`
        },
        createName() {
          // remove any parts of url beyond repo name
          let urlParts = this.repoUrl.split("/");
          return `${urlParts[3]}/${urlParts[4]}`
        },
        async runInspect() {
          // collect initial data on repo and send message to background to start inspecting it.
            try {
              if (!this.repoUrl) {
                this.showError("You must enter a repo to inspect!");
                return;                
              }
              if (this.urlStoreData[this.repoUrl]) {
                this.showError("Repo is already inspected!");
                return;
              }
              this.currentRepo = this.repoUrl;
              let octokit = initOctokit(this.token);
              const {data: { stargazers_count, forks }} = await octokit.request(`GET ${this.cleanRepoUrl()}`)
              this.summary = { stargazers_count, forks }
              this.showSummary = true
              await urlStore.createUrl(this.repoUrl, stargazers_count, forks, this.createName())
              this.refreshStore();
              // chrome.runtime.sendMessage({
              //   msg: "inspectRepo"
              // })
              chrome.runtime.openOptionsPage()
            }
            catch(error) {
              if (error.status === 401) {
                this.showError("Token has expired!");
              }
              else {
                this.showError("Something went wrong");
              }
              console.error(error)
            }
        },
        async refreshStore() {
          this.urlStoreData = await urlStore.all();
          this.urlQueue = await urlStore.getUrlQueue();
  
      },
      keys(data) {
        return Object.keys(data)
      },
      cancelUrl() {
        this.currentRepo = null;
        urlStore.delete(this.cancel).then(()=> {this.refreshStore()});
        this.cancel = 0;
      },
      showError(error) {
        this.error = error;
        setTimeout(()=> {
          this.error = null;
        }, 5000)
      },
      openLogin() {
        auth.loginWithGoogle();
      },
      async runLogout() {
        queueService.deactivateInterval();
        auth.logout();
        await timeout(500);
        window.close();
      }
      },
      mounted() {
        setInterval(()=> {
          this.refreshStore();
        }, 5000)
      }
      
  }

  window.addEventListener("message", (event) => {
    console.log(event)
  }, false);

  </script>
  

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
</style>