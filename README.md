# repoInspector

repoInspector is a Github repository inspector built for anyone to gather useful data on open source repositories. Using the open Github API, we package and present available data about any repository, including: 
- number of profiles 
- number of active users 
- number of all users
- Geographical breakdown (countries)
- Organizations to which a repo’s users belong
- Plus, other data as available

This one’s designed to be simple to use as a Chrome extension, for startup founders, devs, investors, and really - anyone!  


## Let's get started!
1. Download the Chrome Extension here [TBD] 
2. Log into your Github account (if you don't have one, create one).
3. Create a token by clicking here or by going to Settings > Developer Settings > Personal Access Token -> Classic
4. Press 'Generate new token' -> Classic -> and create a token, checking off the following permissions:

```
 repo:status Access commit status
 repo_deployment Access deployment status
 public_repo Access public repositories
 repo:invite Access repository invitations
 read:packages Download packages from GitHub Package Registry
 read:org Read org and team membership, read org projects
 read:public_key Read user public keys
 read:repo_hook Read repository hooks
 read:user Read ALL user profile data
 user:email Access user email addresses (read-only)
 read:discussion Read team discussions
 read:enterprise Read enterprise profile data
 read:project Read access of projects
```
> :warning: Set the token’s expiration to whatever you’re comfortable with. We’ll never ask you for your token, and it will always be stored on your computer.

5. Open the Chrome extension and paste the token into the token field. 
6. After saving the token, you will be asked to log in with Gmail so we can email you repo data as you request it.

## Using repoInspector
You’re ready to start inspecting repositories! Here’s how that works: 

1. In your browser, go to the Github page for a repository you’re curious about, open the Chrome extension and click Inspect. 
     
     Before you inspect, you have a few options for the data. Toggle between receiving Only Stars (default), Only Forks, Stars and Forks, or Sampling.
2. Once you click Inspect, you’ll see a progress window. 
     
     Note - it may take a few seconds to start showing progress, and the larger the amount of Stars or Forks, the longer it will take to start and progress. 
3. Your result will arrive in your inbox once the progress bar hits 100%. 
     
     If you don't see the email right away, check your spam folder. The report will send from repoinspector@hetzventures.org.

## About us 
repoInspector was originally designed and started by the team at Hetz Ventures. We were looking for a simple way to access useful data on repository user activity around Github projects for industry insights, due diligence, comparative analysis, etc. 

This Chrome extension is useful for other investors, startup founders and really anyone looking to better understand user behavior and their markets. 

We welcome contributors to this project! Here’s how you can get set up:

## Project setup
There is both a client and a server in this repository. You can decide to only work on the client side (i.e. the chrome extension) or on both.
To set up the client side, clone the repo and:
```
cd chrome-extension
yarn install
```

### Compiles and hot-reloads for development
```
yarn build-watch
```
This will create a `dist` folder. Go to [chrome://extensions](chrome://extensions) and click 'Load unpacked', after which navigate to the `dist` folder and click open, the extension should load and will reload with every save to the codebase.

### Compiles and minifies for production
```
yarn run build
```

### Lints and fixes files
```
yarn run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


### Server setup
```
cd server
pip install -r requirements.txt
```
Create a file called `.secrets.toml` in the `server` directory and fill it in with the following (fill in the missing variables):
```
[development]
dynaconf_merge = true

[development.db]
sql_url = ''

[development.google]
data_client_id = ""

[development.email]
username = ''
password = ''
smtp_server = ''
port = ''

[development.security]
# openssl rand -hex 32
SECRET_KEY = ""
```
### Run server
```
uvicorn main:app
```
### Production Setup
The server is set up to run on Heroku, to push to heroku, add a new heroku remote and run from the base folder:
```
git subtree push --prefix server heroku main
```
The environment variables convention on the server `API_DB__<var name>` so for sql_url it would be `API_DB__sql_url`.
## Classifications

Some data is classified by our business logic and is not fetched directly from Github. The following are data points we have defined:
- Real user - user who has had more than three "events" (commit, PR, etc.) or user who has more than three followers.
- Active user - user who has an event in the past year.
- Country - while users can input their location in their profile, this is free-text which make it difficult to aggregate. To solve this problem, we use nominatim.openstreetmap.org location api to fetch the country of every location free-text and extract its country.
