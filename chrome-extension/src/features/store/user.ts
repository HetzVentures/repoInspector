import { USER_DB } from './models';

class UserStore {
  // Global class which holds the collected data from repositories. Saving this data to the chrome storage results in errors and many
  // writes, so all data will be stored in a global variable and sent to a server for further processing when it is all collected.
  // This class is primarily used by the background.js file. When the browser is shut down, this data is cleared. This means that if a repo
  // was not completely parsed, it will start from scratch.
  userDb: any;

  constructor() {
    // variable holding all repo data currently being collected
    this.userDb = USER_DB;
  }

  refresh() {
    // initialize this.userDb to an empty dataset
    this.userDb = USER_DB;
  }

  set(type: string, key: string, value: any) {
    // set data to global variable by key value
    this.userDb[type][key] = value;
  }
}

// export global instance of UserStore class
export const userStore = new UserStore();
