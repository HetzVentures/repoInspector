# repoInspector

repoInspector is a Github repository inspector built for anyone to gather useful data on open source repositories. Using the open Github API, we package and present available data about any repository, including: 
- # of profiles 
- # of active users 
- # of all users
- Geographical breakdown (countries)
- Organizations to which a repo’s users belong
- Plus, other data as available

This one’s designed to be simple to use as a Chrome extension, for startup founders, devs, investors, and really - anyone!  


## Let's get started!
- Download the chrome extension here
- Log into your Github account (create one if you don't have one yet)
- Create a token by clicking [here](https://github.com/settings/tokens) or by going to profile settings > delveloper settings > token
- Press 'Generate new token' -> classic -> and create a token with the following permissions:
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
> :warning: You can make the expiration on the token anything you are comfortable with, we will never ask you for your token, and it will always be stored on your computer.
- Open the chrome extension and insert the token into the text box. After saving the token, you will be asked to log in with Gmail so we can send you the repo's data.

YAY You did it!
Now go to a repository you want to know about, open the chrome extension and click 'Inspect'!

___
If you are someone who wants to contribute to this project and make it better, we welcome you! here is how you can get set up:
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
