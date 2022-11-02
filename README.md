# repoInspector

repoInspector is a project aiming at gathering useful data on open source repositories. This data includes things like the countries in which a repository is popular, or the organizations to which users who use a repository belong to. This project is published as a chrome extension and can be used imediately without any setup.

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


# GEOCODING
An important part of knowing your repo is knowing where people come from. nominatim.openstreetmap.org provides a free API which requires throttling to use, thus there is a tax of about 1.5 seconds for each API call