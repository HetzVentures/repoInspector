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
                  <button v-bind:aria-busy="setupDelay" v-bind:disabled="!currentUser?.uuid || setupDelay"  v-on:click="openLogin()">Login</button>
                </footer>
              </article>
          </template>
          <template v-else>
              <input v-bind:placeholder="currentRepo ? 'Scanning repo...' : 'Repo URL'" type="text" v-bind:disabled="currentRepo" v-model="repoUrl" name="repoUrl">
              <button v-bind:aria-busy="!!currentRepo" v-bind:disabled="currentRepo" v-on:click="runInspect">Inspect</button>
              <button v-on:click="openDownloads()" class="outline">Downloads Page</button>
              
                <template v-if="currentRepo && urlStoreData[currentRepo]">
                  <DownloadCard
                      v-bind:repoData="urlStoreData[currentRepo]" 
                      v-bind:repoUrl="currentRepo" 
                      @remove="(repo) => cancel = repo" />
                </template>
              
                <article v-if="!currentRepo">
                  <header>Settings</header>
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
                  <fieldset>
                    <label for="sample">
                      <input v-on:change="setSettings('sample', settings.sample)" v-model="settings.sample" type="checkbox" id="sample" name="sample" role="switch">
                      Sample repos <em data-tooltip="Recommended to expedite the inspection">(?)</em>
                    </label>
                    <input class="percent-picker" v-on:change="setSettings('samplePercent', settings.samplePercent)" 
                    v-model="settings.samplePercent" v-if="settings.sample" 
                    v-bind:aria-invalid="0 >= settings.samplePercent || settings.samplePercent > 100"
                    type="number" min="1" max="100" placeholder="Sample percent">
                  </fieldset>

                  <footer>
                      <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="19" height="19"><path d="M5.65 12.477a.5.5 0 10-.3-.954l.3.954zm-3.648-2.96l-.484-.128-.254.968.484.127.254-.968zM9 14.5v.5h1v-.5H9zm.063-4.813l-.054-.497a.5.5 0 00-.299.852l.352-.354zM12.5 5.913h.5V5.91l-.5.002zm-.833-2.007l-.466-.18a.5.5 0 00.112.533l.354-.353zm-.05-2.017l.456-.204a.5.5 0 00-.319-.276l-.137.48zm-2.173.792l-.126.484a.5.5 0 00.398-.064l-.272-.42zm-3.888 0l-.272.42a.5.5 0 00.398.064l-.126-.484zM3.383 1.89l-.137-.48a.5.5 0 00-.32.276l.457.204zm-.05 2.017l.354.353a.5.5 0 00.112-.534l-.466.181zM2.5 5.93H3v-.002l-.5.002zm3.438 3.758l.352.355a.5.5 0 00-.293-.851l-.06.496zM5.5 11H6l-.001-.037L5.5 11zM5 14.5v.5h1v-.5H5zm.35-2.977c-.603.19-.986.169-1.24.085-.251-.083-.444-.25-.629-.49a4.8 4.8 0 01-.27-.402c-.085-.139-.182-.302-.28-.447-.191-.281-.473-.633-.929-.753l-.254.968c.08.02.184.095.355.346.082.122.16.252.258.412.094.152.202.32.327.484.253.33.598.663 1.11.832.51.168 1.116.15 1.852-.081l-.3-.954zm4.65-.585c0-.318-.014-.608-.104-.878-.096-.288-.262-.51-.481-.727l-.705.71c.155.153.208.245.237.333.035.105.053.254.053.562h1zm-.884-.753c.903-.097 1.888-.325 2.647-.982.78-.675 1.237-1.729 1.237-3.29h-1c0 1.359-.39 2.1-.892 2.534-.524.454-1.258.653-2.099.743l.107.995zM13 5.91a3.354 3.354 0 00-.98-2.358l-.707.706c.438.44.685 1.034.687 1.655l1-.003zm-.867-1.824c.15-.384.22-.794.21-1.207l-1 .025a2.12 2.12 0 01-.142.82l.932.362zm.21-1.207a3.119 3.119 0 00-.27-1.195l-.913.408c.115.256.177.532.184.812l1-.025zm-.726-.99c.137-.481.137-.482.136-.482h-.003l-.004-.002a.462.462 0 00-.03-.007 1.261 1.261 0 00-.212-.024 2.172 2.172 0 00-.51.054c-.425.091-1.024.317-1.82.832l.542.84c.719-.464 1.206-.634 1.488-.694a1.2 1.2 0 01.306-.03l-.008-.001a.278.278 0 01-.01-.002l-.006-.002h-.003l-.002-.001c-.001 0-.002 0 .136-.482zm-2.047.307a8.209 8.209 0 00-4.14 0l.252.968a7.209 7.209 0 013.636 0l.252-.968zm-3.743.064c-.797-.514-1.397-.74-1.822-.83a2.17 2.17 0 00-.51-.053 1.259 1.259 0 00-.241.03l-.004.002h-.003l.136.481.137.481h-.001l-.002.001-.003.001a.327.327 0 01-.016.004l-.008.001h.008a1.19 1.19 0 01.298.03c.282.06.769.23 1.488.694l.543-.84zm-2.9-.576a3.12 3.12 0 00-.27 1.195l1 .025a2.09 2.09 0 01.183-.812l-.913-.408zm-.27 1.195c-.01.413.06.823.21 1.207l.932-.362a2.12 2.12 0 01-.143-.82l-1-.025zm.322.673a3.354 3.354 0 00-.726 1.091l.924.38c.118-.285.292-.545.51-.765l-.708-.706zm-.726 1.091A3.354 3.354 0 002 5.93l1-.003c0-.31.06-.616.177-.902l-.924-.38zM2 5.93c0 1.553.458 2.597 1.239 3.268.757.65 1.74.88 2.64.987l.118-.993C5.15 9.09 4.416 8.89 3.89 8.438 3.388 8.007 3 7.276 3 5.928H2zm3.585 3.404c-.5.498-.629 1.09-.584 1.704L6 10.963c-.03-.408.052-.683.291-.921l-.705-.709zM5 11v3.5h1V11H5zm5 3.5V13H9v1.5h1zm0-1.5v-2.063H9V13h1z" fill="currentColor"></path></svg>
                      Lost? Review instructions <a target="_blank" href="https://github.com/HetzVentures/repoInspector">here</a>
                  </footer>
              </article>
              <button @click="logout = 1" class="secondary outline mt-32">Logout</button>

          </template>  
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
  import { timeout, getOwnTabs } from '@/js/helpers'
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
          logout: 0,
          setupDelay: true
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
              if (!this.settings?.forks && !this.settings?.stars) {
                this.showError("You must select if you want forks, stars or both (but not none)");
                return;                
              }
              if (this.settings?.sample && (0 >= settings.samplePercent || settings.samplePercent > 100)) {
                this.showError("Please choose a sample percentage between 1 and 100");
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
        // if current repo is being downloaded but download page has been shut down open it up
        if (this.currentRepo) {
          const tab = await getOwnTabs();
          if (!tab.length) {
            chrome.runtime.openOptionsPage()
          }
        }
        
        setInterval(()=> {
          this.refreshStore();
        }, 5000)
        this.currentUser = await auth.getStoredUser()
        
        // check if current user has logged in
        if (!this.currentUser?.email) {
          setInterval(async()=> {
            this.currentUser = await auth.getStoredUser()
        }, 2000);
        setTimeout(()=> {
            this.setupDelay = false;
        }, 2000)
        
        }
      }
      
  }


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
  .percent-picker {
    margin-top: 12px;
    margin-bottom: 0;
  }
</style>