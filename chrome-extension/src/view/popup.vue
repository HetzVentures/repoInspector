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

              <article>
                <header>Hi!</header>
                This is repo inspector - a tool for extracting data from repositories. 
                We will need a github access token to begin. Click the link to get started
                <footer>
                  <a role="button" target="_blank" href="https://github.com/HetzVentures/repoInspector" class="outline">Let's get started!</a>
                </footer>
              </article>

          </template>
          <template v-else-if="!currentUser.email">
            <article>
                <header>Almost there!</header>
                We will email you the results of the inspection. The inspection is done on your computer 
                and we aggregate the data for you and send it your way. We will only use your email to send you the search results.
                <footer>
                  <button v-bind:disabled="!currentUser?.uuid"  v-on:click="openLogin()">Login</button>
                </footer>
              </article>
          </template>
          <template v-else>
              <input v-bind:placeholder="currentRepo ? 'Scanning repo...' : 'Repo URL'" type="text" v-bind:disabled="currentRepo" v-model="repoUrl" name="repoUrl">
              <button v-bind:aria-busy="!!currentRepo" v-bind:disabled="currentRepo" v-on:click="runInspect">Inspect</button>
              <button v-if="keys(urlStoreData).length" v-on:click="openDownloads()" class="outline">Downloads Page</button>

              
              <template v-for="urlKey of keys(urlStoreData)">
                <DownloadCard v-if="urlKey === currentRepo"
                          v-bind:key="urlKey"
                          v-bind:repoData="urlStoreData[urlKey]" 
                          v-bind:repoUrl="urlKey" 
                          v-bind:currentRepo="currentRepo"
                          @remove="(repo) => cancel = repo" />
              </template>
                <article v-if="!currentRepo">
                  <header>Settings</header>
                  <fieldset>
                    <label for="sample">
                      <input v-on:change="setSettings('sample', settings.sample)" v-model="settings.sample" type="checkbox" id="sample" name="sample" role="switch">
                      Sample repos with over 2k user <em data-tooltip="Recommended to expedite the inspection">(?)</em>
                    </label>
                  </fieldset>
                  <fieldset>
                    <label for="location">
                      <input v-on:change="setSettings('location', settings.location)" v-model="settings.location" type="checkbox" id="location" name="location" role="switch">
                      Aggregate location <em data-tooltip="Getting aggregated user location slows inspection">(?)</em>
                    </label>
                  </fieldset>
                  <fieldset>
                    <label for="stars">
                      <input v-on:change="setSettings('stars', settings.stars)" v-model="settings.stars" type="checkbox" id="stars" name="stars" role="switch">
                      Get users who have <b>starred</b> the repo
                    </label>
                  </fieldset>
                  <fieldset>
                    <label for="forks">
                      <input v-on:change="setSettings('forks', settings.forks)" v-model="settings.forks" type="checkbox" id="forks" name="forks" role="switch">
                      Get users who have <b>forked</b> the repo
                    </label>
                  </fieldset>
                  <footer>
                      Lost? Review instructions <a target="_blank" href="https://github.com/HetzVentures/repoInspector">here</a>
                  </footer>
              </article>
              <button @click="logout = 1" class="secondary outline mt-32">Logout</button>

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
              <template v-if="!currentRepo">
              <p>
                Are you sure you want to log out? All data will be deleted
              </p>
              <footer>
                    <button style="width: 40%" v-on:click="logout = 0" role="button" class="secondary">Cancel</button>
                    <button style="width: 40%" v-on:click="runLogout()" role="button">Confirm</button>
              </footer>
            </template>
            <template v-else>
              <p>
                In order to log out, first stop your active inspections
              </p>
              <footer>
                    <button style="width: 40%" v-on:click="logout = 0" role="button" class="secondary">Ok</button>
              </footer>
            </template>
            </article>
          </dialog>
      </div>
  
  </main>
  
    
  </template>
  
  <script>
  import DownloadCard from './components/DownloadCard.vue'
  import { urlStore } from '@/js/store'
  import {initOctokit} from '@/js/octokit'
  import {token, url, urlList, urlStoreData, urlQueue, currentRepo, settings} from '@/entry/popup'
  import { auth } from '@/js/authentication'
  import { queueService } from '@/js/queue'
  import { timeout } from '@/js/helpers'
  import { settingsStore } from '@/js/store'

  export default {
      components: { DownloadCard },
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
          settings: settings,
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
        setSettings(k, v) {
          this.settings[k] = v;
          settingsStore.set(this.settings);
        },
        async runInspect() {
          // collect initial data on repo and send message to background to start inspecting it.
            try {
              if (!this.repoUrl) {
                this.showError("You must enter a repo to inspect!");
                return;                
              }
              if (!this.settings.forks && !this.settings.stars) {
                this.showError("You must select if you want forks, stars or both (but not none)");
                return;                
              }
              this.currentRepo = this.repoUrl;
              let octokit = initOctokit(this.token);
              const {data: { stargazers_count, forks }} = await octokit.request(`GET ${this.cleanRepoUrl()}`)
              this.summary = { stargazers_count, forks }
              this.showSummary = true
              await urlStore.createUrl(this.repoUrl, stargazers_count, forks, this.createName(), this.settings)
              this.refreshStore();
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
        openDownloads() {
          chrome.runtime.openOptionsPage()
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
      async mounted() {
        setInterval(()=> {
          this.refreshStore();
        }, 5000)
        this.currentUser = await auth.getStoredUser()
        
        // check if current user has logged in
        if (!this.currentUser?.email) {
          setInterval(async()=> {
            this.currentUser = await auth.getStoredUser()
        }, 2000)
        }
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
  .mt-32 {
    margin-top: 32px
  }
</style>