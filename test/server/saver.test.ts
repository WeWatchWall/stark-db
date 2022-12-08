import { expect } from 'chai';
import FlatPromise from 'flat-promise';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Results } from '../../src/objects/results';
import { UserDB } from '../../src/server/objects/DBUser';
import { Saver } from '../../src/server/threads/threads';
import { DB_DRIVER, SAVER_CHANNEL, Target } from '../../src/utils/constants';
import { PersistCall } from '../../src/utils/threadCalls';

const DB_PATH = './test';
const DB_FILE = 'test.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);

const TABLE1 = 'test_data1';
const TABLE2 = 'test_data2';

const tests = [
  {
    name: 'init',
    id: 1,
    args: {
      id: 1,
      isWrite: true,
      isLong: false,
      results: undefined
    },
    results: []
  }, {
    name: 'add',
    id: 2,
    args: {
      id: 2,
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
    },
    results: [
      {
        name: TABLE1,
        rows: [
          { id: 1, value: 'test1' },
          { id: 2, value: 'test2' },
        ]
      }, {
        name: TABLE2,
        rows: [
          { id: 1, value: 'test3' },
          { id: 2, value: 'test4' },
        ]
      }
    ]
  }, {
    name: 'add & set',
    id: 2,
    args: {
      id: 2,
      isWrite: true,
      isLong: false,
      results: [
        {
          name: TABLE1,
          keys: ['id'],
          rows: [
            { id: 1, value: 'test5' },
            { id: 2, value: 'test6' },
          ]
        }, {
          name: TABLE2,
          keys: ['id'],
          rows: [
            { id: 3, value: 'test7' },
            { id: 4, value: 'test8' },
          ]
        }
      ]
    },
    results: [
      {
        name: TABLE1,
        rows: [
          { id: 1, value: 'test5' },
          { id: 2, value: 'test6' },
        ]
      }, {
        name: TABLE2,
        rows: [
          { id: 1, value: 'test3' },
          { id: 2, value: 'test4' },
          { id: 3, value: 'test7' },
          { id: 4, value: 'test8' },
        ]
      }
    ]
  }
];

async function runTest(test: any, target: Target) {
  const saver: Saver = new Saver(DB_PATH_FILE, target);
  try {
    await saver.init();

    // Invoke the saver.add method.
    const args = Object.assign({}, test.args);
    args.target = target;

    const results = test.results ? Results.init(args) : undefined;
    await saver.add(results);

    // Check the results.
    for (const testResult of test.results) {
      const rows = await saver.DB.query(`SELECT * FROM "${testResult.name}"`);
      expect(rows).to.deep.equal(testResult.rows);
    }
  } finally {
    await saver.destroy();
  }
}

async function runTestBC(test: any, target: Target) {
  const saver: Saver = new Saver(DB_PATH_FILE, target);
  let BC: BroadcastChannel;
  try {
    await saver.init();

    /* #region  Invoke the saver.add method through the BC. */
    const channelName = `${SAVER_CHANNEL}-${saver.target}-${saver.name}`;
    BC = new BroadcastChannel(channelName);

    const promise = new FlatPromise();
    BC.onmessage = async (event: any) => {
      const { name, args }: {
        name: string;
        args: [number];
      } = event.data;

      if (name === PersistCall.set) {
        const [id] = args;
        promise.resolve(id);
      } else {
        promise.reject();
      }
    };

    const args = Object.assign({}, test.args);
    args.target = target;

    BC.postMessage({
      name: PersistCall.add,
      args: [args]
    });

    const id = await promise.promise;
    expect(id).to.equal(test.id);
    /* #endregion */

    // Check the results.
    for (const testResult of test.results) {
      const rows = await saver.DB.query(`SELECT * FROM "${testResult.name}"`);
      expect(rows).to.deep.equal(testResult.rows);
    }
  } finally {
    BC.close();
    await saver.destroy();
  }
}

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

  for (const test of tests) {
    it(`Saver - DB Target: ${test.name}`, async () => {
      await runTest(test, Target.DB);
    });
  }
});

describe('Server: Saver - DB Target & BC.', function () {
  // this.timeout(600e3);

  this.beforeAll(beforeAllDB);

  for (const test of tests) {
    it(`Saver - DB Target & BC: ${test.name}`, async () => {
      await runTestBC(test, Target.DB);
    });
  }
});
/* #endregion */

/* #region  Memory DB Target. */
let memDB: DataSource;

const beforeAllMem = async () => {
  memDB = new DataSource({
    type: DB_DRIVER,
    database: `file:${DB_PATH_FILE}?mode=memory`,
    flags:
      sqlite3.OPEN_URI |
      sqlite3.OPEN_SHAREDCACHE |
      sqlite3.OPEN_READWRITE |
      sqlite3.OPEN_CREATE,
    cache: true,
    synchronize: false,
    logging: false,
    entities: [],
    migrations: [],
    subscribers: [],
  });

  await memDB.initialize();
  
  await memDB.query(
    `
      CREATE TABLE IF NOT EXISTS "${TABLE1}"
      (
        "id" INTEGER PRIMARY KEY NOT NULL,
        "value" VARCHAR NOT NULL
      );
    `
  );

  await memDB.query(
    `
      CREATE TABLE IF NOT EXISTS "${TABLE2}"
      (
        "id" INTEGER PRIMARY KEY NOT NULL,
        "value" VARCHAR NOT NULL
      );
    `
  );
};

const afterAllMem = async () => {
  await memDB.destroy();
};

describe('Server: Saver - Mem DB Target.', function () {
  // this.timeout(600e3);

  this.beforeAll(beforeAllMem);
  this.afterAll(afterAllMem);

  for (const test of tests) {
    it(`Saver - DB Target: ${test.name}`, async () => {
      await runTest(test, Target.mem);
    });
  }
});

describe('Server: Saver - Mem DB Target & BC.', function () {
  // this.timeout(600e3);

  this.beforeAll(beforeAllMem);
  this.afterAll(afterAllMem);

  for (const test of tests) {
    it(`Saver - DB Target & BC: ${test.name}`, async () => {
      await runTestBC(test, Target.mem);
    });
  }
});
/* #endregion */