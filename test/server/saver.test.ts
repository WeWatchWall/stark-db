import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { Results } from '../../src/objects/results';
import { UserDB } from '../../src/server/objects/DBUser';
import { Saver } from '../../src/server/threads/threads';
import { Target } from '../../src/utils/constants';

const DB_PATH = './test';
const DB_FILE = 'test.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);

const TABLE1 = 'test_data1';
const TABLE2 = 'test_data2';

describe('Server: Saver.', function () {
  // this.timeout(600e3);

  this.beforeAll(async () => {
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
  });

  /* #region  File backend. */
  it(`Saver: DB init`, async () => {
    const saver: Saver = new Saver(DB_PATH_FILE, Target.DB);
    await saver.init();

    await saver.add(Results.init({
      id: 1,
      target: Target.DB,
      isWrite: true,
      isLong: false,
      results: [
        {
          name: TABLE1,
          keys: ['id'],
          rows: [
            { id: 1, value: 'test1' },
            { id: 2, value: 'test2' },
          ]
        }, {
          name: TABLE2,
          keys: ['id'],
          rows: [
            { id: 1, value: 'test3' },
            { id: 2, value: 'test4' },
          ]
        }
      ]
    }));

    await saver.destroy();
    expect(true).to.be.equal(true);
  });
  /* #endregion */
});