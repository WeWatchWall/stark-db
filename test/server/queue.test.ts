import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

import { UserDB } from '../../src/server/objects/DBUser';

const DB_PATH = './test';
const DB_FILE = 'test.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);

const TABLE1 = 'test_data1';
const TABLE2 = 'test_data2';

// const tests = {
//   init: [
//     {

//     }
//   ],
//   get: [],
//   add: [],
//   set: [],
//   del: [],
// };

/* #region  File DB Target. */
const beforeAllDB = async () => {
  // Delete the database file if it exists.
  if (existsSync(DB_PATH_FILE)) {
    rmSync(DB_PATH_FILE);
  }

  const userDB = new UserDB({
    name: DB_FILE,
    path: DB_PATH,
  });

  await userDB.validator.readyAsync();

  await userDB.DB.query(
    `
      CREATE TABLE IF NOT EXISTS "${TABLE1}"
      (
        "id" INTEGER PRIMARY KEY NOT NULL,
        "value" VARCHAR NOT NULL
      );
    `
  );

  await userDB.DB.query(
    `
      CREATE TABLE IF NOT EXISTS "${TABLE2}"
      (
        "id" INTEGER PRIMARY KEY NOT NULL,
        "value" VARCHAR NOT NULL
      );
    `
  );

  await userDB.destroy();
}

describe('Server: Saver - DB Target.', function () {
  // this.timeout(600e3);

  this.beforeAll(beforeAllDB);
});
/* #endregion */