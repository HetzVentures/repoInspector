import { INSPECT_DATA_DB } from './models';

class InspectDataStore {
  // Global class which holds the collected data from repositories. Saving this data to the chrome storage results in errors and many
  // writes, so all data will be stored in a global variable and sent to a server for further processing when it is all collected.
  // This class is primarily used by the background.js file. When the browser is shut down, this data is cleared. This means that if a repo
  // was not completely parsed, it will start from scratch.
  inspectDataDb: InspectData;

  constructor() {
    // variable holding all repo data currently being collected
    this.inspectDataDb = { ...INSPECT_DATA_DB };
  }

  refresh() {
    // initialize this.inspectDataDb to an empty dataset
    this.inspectDataDb = { ...INSPECT_DATA_DB };
  }

  set(
    type: keyof InspectData,
    value:
      | DBUser[]
      | IssuesStatistic
      | number
      | StarHistoryByMonth
      | string
      | Date,
  ) {
    // set data to global variable by key value
    // FIXME: fix types
    // @ts-ignore
    this.inspectDataDb[type] = value;
  }

  load(data: InspectData) {
    this.inspectDataDb = data;
  }
}

// export global instance of InspectDataStore class
export const inspectDataStore = new InspectDataStore();
