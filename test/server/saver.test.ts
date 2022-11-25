import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import FlatPromise from 'flat-promise';
import { resolve } from 'path';
import { BroadcastChannel } from 'worker_threads';

import { Results } from '../../src/objects/results';
import { UserDB } from '../../src/server/objects/DBUser';
import { Saver } from '../../src/server/threads/threads';
import { SAVER_CHANNEL, Target } from '../../src/utils/constants';
import { PersistCall } from '../../src/utils/threadCalls';

const DB_PATH = './test';
const DB_FILE = 'test.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);

const TABLE1 = 'test_data1';
const TABLE2 = 'test_data2';

const beforeAll = async () => {
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

/* #region  File DB Target. */
const tests = [
  {
    name: 'init',
    id: 1,
    args: {
      id: 1,
      target: Target.DB,
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
      target: Target.DB,
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

describe('Server: Saver - DB Target.', function () {
  // this.timeout(600e3);

  this.beforeAll(beforeAll);

  for (const test of tests) {
    it(`Saver - DB Target: ${test.name}`, async () => {
      const saver: Saver = new Saver(DB_PATH_FILE, Target.DB);
      let error: unknown;
      try {
        await saver.init();

        const results = test.results ? Results.init(test.args) : undefined;
        await saver.add(results);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.undefined;

      for (const testResult of test.results) {
        const rows = await saver.DB.query(`SELECT * FROM "${testResult.name}"`);
        expect(rows).to.deep.equal(testResult.rows);
      }

      try {
        await saver.destroy();
      } catch (err) {
        error = err;
      }
      expect(error).to.be.undefined;
    });
  }
});

describe('Server: Saver - DB Target & BC.', function () {
  // this.timeout(600e3);

  this.beforeAll(beforeAll);

  for (const test of tests) {
    it(`Saver - DB Target & BC: ${test.name}`, async () => {
      const saver: Saver = new Saver(DB_PATH_FILE, Target.DB);
      let error: unknown;
      let BC: BroadcastChannel;
      try {
        await saver.init();

        const channelName = `${SAVER_CHANNEL}-${saver.target}-${saver.name}`;
        BC = new BroadcastChannel(channelName);

        const promise = new FlatPromise();
        BC.onmessage = async (event: any) => {
          const { name, args }: {
            name: string,
            args: [number]
          } = event.data;

          if (name === PersistCall.set) {
            const [id] = args;
            promise.resolve(id);
          } else {
            promise.reject();
          }
        };

        BC.postMessage({
          name: PersistCall.add,
          args: [test.args]
        });
        const id = await promise.promise;
        expect(id).to.equal(test.id);
      } catch (err) {
        error = err;
      } finally {
        BC.close();
      }
      expect(error).to.be.undefined;

      for (const testResult of test.results) {
        const rows = await saver.DB.query(`SELECT * FROM "${testResult.name}"`);
        expect(rows).to.deep.equal(testResult.rows);
      }

      try {
        await saver.destroy();
      } catch (err) {
        error = err;
      }
      expect(error).to.be.undefined;
    });
  }
});
/* #endregion */