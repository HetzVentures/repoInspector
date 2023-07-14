import { INSPECT_DATA_DB } from './models';

class InspectDataStore {
  // Global class which holds the collected data from repositories. Saving this data to the chrome storage results in errors and many
  // writes, so all data will be stored in a global variable and sent to a server for further processing when it is all collected.
  // This class is primarily used by the background.js file. When the browser is shut down, this data is cleared. This means that if a repo
  // was not completely parsed, it will start from scratch.
  inspectDataDb: any;

  constructor() {
    // variable holding all repo data currently being collected
    this.inspectDataDb = INSPECT_DATA_DB;
  }

  refresh() {
    // initialize this.inspectDataDb to an empty dataset
    this.inspectDataDb = INSPECT_DATA_DB;
  }

  set(type: string, value: any) {
    // set data to global variable by key value
    this.inspectDataDb[type] = value;
  }
}

// export global instance of InspectDataStore class
export const inspectDataStore = new InspectDataStore();
