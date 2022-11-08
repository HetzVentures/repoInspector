// Button setup script
// const { Octokit } = require("@octokit/core");
// let octokit;
// const PER_PAGE = 100;

const setupInspector = () => {
    // setup button
    const a = document.createElement("a");
    a.classList = "btn ml-2 d-none d-md-block";
    a.innerText = 'Inspect';
    a.href = `chrome-extension://gpbbcpjccbhdjnjkpbmkbdhhlocpfbne/options.html`;
    const addFileButton = document.getElementsByClassName("btn ml-2 d-none d-md-block")[0];
    addFileButton.parentElement.insertBefore(a, addFileButton);
    
    // setup octokit
    // const tokenElm = document.getElementById("githubInspectorToken");
    // octokit = new Octokit({ auth: tokenElm.value });
    // clear token from dom
    // tokenElm.value = "";

    // const iframe = document.createElement("iframe");
    // iframe.src = "https://github.com/"
    // document.getElementsByTagName("body")[0].append(iframe);

}

setTimeout(setupInspector, 1000)


// class RepoInspector {

//     constructor() {
//         this.queue = [];
//         this.repoUrl = document.location.href;
//         this.apiUrl = this._apiUrl();
//         this.urlData = {}
//     }

//     _apiUrl() {
//         // get repo name for octokit
//         return `/repos/${this._createName()}`
//     }

//     _createName() {
//         // remove any parts of url beyond repo name
//         let urlParts = this.repoUrl.split("/");
//         return `${urlParts[3]}/${urlParts[4]}`
//     }


//     async runInspect() {
//         fetch("https://www.labayitgifts.co.il/test.js")
//         // collect initial data on repo and send message to background to start inspecting it.
//         //   try {
//         //     // insert warning if repo already being inspected
            
//         //     const {data: { stargazers_count, forks }} = await octokit.request(`GET ${this.apiUrl}`)
//         //   }
//         //   catch(error) {
//         //     if (error.status === 401) {
//         //       alert("Token has expired!");
//         //     }
//         //     else {
//         //       alert("Something went wrong");
//         //     }
//         //     alert(error)
//         //   }
//       }



//     async inspectAssets() {
//         console.log("clicked")
//         const inspectionParams = [
//             {
//                 mapper: (data)=> data.map(x => x.url),
//                 type: "stargazers"
//             },
//             {
//                 mapper: (data)=> data.map(x => x.owner.url),
//                 type: "forks"
//             }
//         ]
//         this.inspect(inspectionParams)
//     }

//     async inspect(inspectionParams) {
//         // inspect function runs in the background and looks at all the users from "forks" and "stargazers" lists. For each
//         // one of these categories, the octokit API will return PER_PAGE users. As the background job runs every minute, and both
//         // "forks" and "stargazers" are run sequentially, this results in an initial set of API calls made to collect the users urls.
//         // The "inspect" function can handle only one repo at a time, once it is done extracting all the user urls, it sends them to a queueing
//         // service (see queue.js) so that the data can be collected and throttled to manage rate limits.
//         // The data it collected by the qto a server for further processing.
//         // All data regarding a particular repo are stored in a JS object and not in the local storage. This means that if chrome is
//         // restarted, all data collected will be lost.


//         for (let inspection of inspectionParams) {
            
//             const type = inspection.type;
//             const mapper = inspection.mapper;
            
//             // the github API return a max of PER_PAGE users per API call, the max pages we must parse to inspect the repo is therefore <user_count>/PER_PAGE
//             const maxPages = Math.ceil(this.urlData[`${type}_count`]/PER_PAGE)
    
//             // Look for all assets's users
//             for (let inspectedPages = 1; inspectedPages <= maxPages; inspectedPages++) {
//                 // while we haven't finished parsing through the current chunk, look for users in repo
//                 try {
//                     const url = `${this.apiUrl}/${type}?page=${inspectedPages}&per_page=${PER_PAGE}`
//                     await this.run(type, url, mapper);
//                 }
//                 catch(error) {
//                     console.log(error)
//                 }
//             }

//         }
//         // after all data has been added to the queue, activate the queue interval     
//         // queueService.run(repo);
//     }

    
//     async run(type, url, mapper) {
//         // TODO run over inputted url and store the data. At the end of a inspection look over all failed URLs and retry them
//         // eslint-disable-next-line no-async-promise-executor
//         return new Promise(async (resolve) => {
//             // const users = []
//             try {
//                 // minimal throttling for initial run. This makes sure that if we have many stars and forks we don't endanger the limit
//                 // await timeout(300);
//                 const { data } = await octokit.request(`GET ${url}`)
//                 const userUrls = mapper(data)
//                 if (!userUrls.length) {
//                     // there aren't any more pages to look through
//                     resolve()
//                 }
//                 userUrls.forEach(async (userUrl, i, arr) => {
//                     // add the user url and the parsing type to the queue service to gather further data.
//                     // we use a queue as fetching the data directly can hit rate limits on the API. We don't want to control
//                     // for that in this part of the code because this code runs every minute and could potentially trigger multiple
//                     // queries simultaneously. Instead we run the queries directly through the queue in a single thread with throttling
//                     // to account for API needs.

//                     this.queue.push({type, userUrl})
    
//                     if (i === arr.length - 1){ 
//                         resolve()
//                     }
//                 })
//             }
//             catch(error) {
//                 console.error(error)
//             }
//         })
//     }
// }

// const repoInspector = new RepoInspector()