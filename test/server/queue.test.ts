import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';

import { Commit } from '../../src/entity/commit';
import { UserDB } from '../../src/server/objects/DBUser';
import { Queue } from '../../src/server/threads/threads';
import { DB_DRIVER, Target, ZERO } from '../../src/utils/constants';

const DB_PATH = './test';
const DB_FILE = 'test.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);

const TABLE1 = 'test_data1';
const TABLE2 = 'test_data2';

const tests = {
  init: [
    {
      id: 1,
      name: 'Single query.',
      commits: [
        {
          queries: [`INSERT INTO ${TABLE1} VALUES (?, ?);`],
          params: [[1, 'test1']],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }
      ],
      results: {
        TABLE1: [
          { id: 1, value: 'test1' }
        ],
        TABLE2: [],
      }
    }, {
      id: 2,
      name: 'Multiple queries and multiple tables.',
      commits: [
        {
          queries: [
            `UPDATE ${TABLE1} SET value = ? WHERE id = ?;`,
            `INSERT INTO ${TABLE2} VALUES (?, ?), (?, ?);`,
          ],
          params: [
            ['test2', 1],
            [1, 'test3', 2, 'test4'],
          ],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }
      ],
      results: {
        TABLE1: [
          { id: 1, value: 'test2' }
        ],
        TABLE2: [
          { id: 1, value: 'test3' },
          { id: 2, value: 'test4' }
        ],
      }
    }, {
      id: 3,
      name: 'Multiple commits.',
      commits: [
        {
          queries: [
            `INSERT INTO ${TABLE1} VALUES (?, ?);`,
          ],
          params: [
            [2, 'test5'],
          ],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }, {
          queries: [
            `INSERT OR REPLACE INTO ${TABLE2} VALUES (?, ?), (?, ?);`,
          ],
          params: [
            [1, 'test6', 2, 'test7'],
          ],

          isSaved: false,
          isLong: true,
          isLongQuery: false,
        }
      ],
      results: {
        TABLE1: [
          { id: 1, value: 'test2' },
          { id: 2, value: 'test5' }
        ],
        TABLE2: [
          { id: 1, value: 'test6' },
          { id: 2, value: 'test7' }
        ],
      }
    }, {
      id: 4,
      name: 'Skip saved commits.',
      commits: [
        {
          queries: [
            `INSERT OR REPLACE INTO ${TABLE1} VALUES (?, ?);`,
          ],
          params: [
            [1, 'test5'],
          ],

          isSaved: true,
          isLong: false,
          isLongQuery: false,
        }, {
          queries: [
            `INSERT OR REPLACE INTO ${TABLE2} VALUES (?, ?), (?, ?);`,
          ],
          params: [
            [1, 'test8', 2, 'test9'],
          ],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }
      ],
      results: {
        TABLE1: [
          { id: 1, value: 'test2' },
          { id: 2, value: 'test5' }
        ],
        TABLE2: [
          { id: 1, value: 'test8' },
          { id: 2, value: 'test9' }
        ],
      }
    }, {
      id: 5,
      name: 'Stop on isLongQuery commits.',
      commits: [
        {
          queries: [
            `INSERT OR REPLACE INTO ${TABLE1} VALUES (?, ?);`,
          ],
          params: [
            [1, 'test3'],
          ],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }, {
          queries: undefined,
          params: undefined,

          isSaved: false,
          isLong: false,
          isLongQuery: true,
        }, {
          queries: [
            `INSERT OR REPLACE INTO ${TABLE2} VALUES (?, ?), (?, ?);`,
          ],
          params: [
            [1, 'test10', 2, 'test11'],
          ],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }
      ],
      results: {
        TABLE1: [
          { id: 1, value: 'test3' },
          { id: 2, value: 'test5' }
        ],
        TABLE2: [
          { id: 1, value: 'test8' },
          { id: 2, value: 'test9' }
        ],
      }
    }, {
      id: 6,
      name: 'Stop for fragmented commits.',
      commits: [
        {
          queries: [
            `INSERT OR REPLACE INTO ${TABLE1} VALUES (?, ?);`,
          ],
          params: [
            [1, 'test3'],
          ],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }, {
          id: 3,
          queries: [
            `INSERT OR REPLACE INTO ${TABLE2} VALUES (?, ?), (?, ?);`,
          ],
          params: [
            [1, 'test12', 2, 'test13'],
          ],

          isSaved: false,
          isLong: false,
          isLongQuery: false,
        }
      ],
      results: {
        TABLE1: [
          { id: 1, value: 'test3' },
          { id: 2, value: 'test5' }
        ],
        TABLE2: [
          { id: 1, value: 'test8' },
          { id: 2, value: 'test9' }
        ],
      }
    }
  ],
  get: [],
  add: [],
  set: [],
  del: [],
};

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

describe('Server: Queue Init - DB Target.', function () {
  // this.timeout(600e3);

  this.beforeAll(beforeAllDB);

  for (const test of tests.init) {
    it(`Init ${test.id}: ${test.name}`, async () => {

      // Create a new database.
      let userDB: DataSource;
      let queue: Queue;

      try {
        userDB = getDBConnection(DB_PATH_FILE, Target.DB);
        await userDB.initialize();
        
        // Save the commits.
        for (const commitObject of test.commits) {
          const commit = new Commit(commitObject);
          await userDB.manager.save(commit);
        }

        // Create and initialize the queue.
        queue = new Queue(DB_PATH_FILE, Target.DB);
        await queue.init();

        // Check the values from TABLE1.
        const TABLE1Values = await userDB.query(`SELECT * FROM ${TABLE1};`);
        expect(TABLE1Values).to.deep.equal(test.results.TABLE1);

        // Check the values from TABLE2.
        const TABLE2Values = await userDB.query(`SELECT * FROM ${TABLE2};`);
        expect(TABLE2Values).to.deep.equal(test.results.TABLE2);

        const commits = await userDB.manager.find(Commit);
        expect(commits).to.have.lengthOf(ZERO);
      } finally {
        // Destroy the DB connection.
        await userDB.destroy();

        // Destroy the queue.
        await queue.destroy();
      }
    });
  }
});
/* #endregion */

function getDBConnection(name: string, target: Target): DataSource {
  switch (target) {
    case Target.DB:
      return new DataSource({
        type: DB_DRIVER,
        database: name,
        cache: true,
        synchronize: true, // TODO: should this be disabled?
        logging: false,
        entities: [Commit],
        migrations: [],
        subscribers: [],
      });
    case Target.mem:
      return new DataSource({
        type: DB_DRIVER,
        database: `file:${name}?mode=memory`,
        flags:
          sqlite3.OPEN_URI |
          sqlite3.OPEN_SHAREDCACHE |
          sqlite3.OPEN_READWRITE |
          sqlite3.OPEN_CREATE,
        cache: true,
        synchronize: true, // TODO: should this be disabled?
        logging: false,
        entities: [Commit],
        migrations: [],
        subscribers: [],
      });
    default:
      throw new Error(`Invalid target: ${target}`);
  }
};