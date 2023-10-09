import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { setTimeout } from 'timers/promises';
import { DataSource } from 'typeorm';

import { StarkWorker } from '../../src/services/worker';
import { getDBConnection } from '../../src/utils/DB';
import { DB_IDENTIFIER, Target, VARS_TABLE, ZERO } from '../../src/utils/constants';
import { Variable } from '../../src/utils/variable';
import { Method } from '../../src/utils/method';
import { Variable as VariableObject } from '../../src/objects/variable';
import { Variable as VariableEntity } from '../../src/entities/variable';
import { Table } from '../../src/entities/table';

const DB_PATH = './test';
const DB_FILE = 'test-worker.db';
const DB_FILE_MEM = 'test-worker-mem.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);
const DB_PATH_FILE_MEM = resolve(DB_PATH, DB_FILE_MEM);

const TABLE1 = 'test_data1';
const TABLE2 = 'test_data2';

const tests = [
  /* #region Manage both file and memory database schema. */
  {
    id: 0,
    name: 'Create table - memory, single query.',

    script: `CREATE TABLE IF NOT EXISTS ${TABLE1}
(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "value" VARCHAR NOT NULL
);`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 0,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE1}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 1,
    }],

    isSkip: false,
  }, {
    id: 1,
    name: 'Create table - file only, single query.',

    script:
      `UPDATE ${VARS_TABLE} SET value = 0 WHERE name = "${Variable.isMemory}";
      CREATE TABLE IF NOT EXISTS ${TABLE2} (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "value" VARCHAR NOT NULL
      );`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 1,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE2}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 0,
    }],

    isSkip: false,
  }, {
    id: 2,
    name: 'Rename table - memory, single query.',

    script: `ALTER TABLE ${TABLE1} RENAME TO ${TABLE1}_1;`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 2,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE1}_1";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1
    }],
    readMem: [{
      "COUNT(*)": 1
    }],

    isSkip: false,
  }, {
    id: 3,
    name: 'Rename table - file only, single query.',

    script: `ALTER TABLE ${TABLE2} RENAME TO ${TABLE2}_1;`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 3,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE2}_1";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 0,
    }],

    isSkip: false,
  }, {
    id: 4,
    name: 'Drop table - memory, single query.',

    script: `DROP TABLE IF EXISTS ${TABLE1}_1;`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 4,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE1}_1";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 0
    }],
    readMem: [{
      "COUNT(*)": 0
    }],

    isSkip: false,
  }, {
    id: 5,
    name: 'Drop table - file only, single query.',

    script: `DROP TABLE IF EXISTS ${TABLE2}_1;`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 5,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE2}_1";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 0,
    }],
    readMem: [{
      "COUNT(*)": 0,
    }],

    isSkip: false,
  }, {
    id: 6,
    name: 'Create table repeat - memory, single query.',

    script: `CREATE TABLE IF NOT EXISTS ${TABLE1}
(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "value" VARCHAR NOT NULL
);`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 6,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE1}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 1,
    }],

    isSkip: false,
  }, {
    id: 7,
    name: 'Create table repeat - file only, single query.',

    script:
      `UPDATE ${VARS_TABLE} SET value = 0 WHERE name = "${Variable.isMemory}";
      CREATE TABLE IF NOT EXISTS ${TABLE2} (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "value" VARCHAR NOT NULL
      );`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 7,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE2}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 0,
    }],

    isSkip: false,
  }, {
    id: 8,
    name: 'Add column - memory, single query.',

    script: `ALTER TABLE ${TABLE1} ADD COLUMN "value1" VARCHAR NOT NULL;`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 8,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE1}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1
    }],
    readMem: [{
      "COUNT(*)": 1
    }],

    isSkip: false,
  }, {
    id: 9,
    name: 'Add column - file only, single query.',

    script: `ALTER TABLE ${TABLE2} ADD COLUMN "value1" VARCHAR NOT NULL;`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 9,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE2}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 0,
    }],

    isSkip: false,
  }, {
    id: 10,
    name: 'Drop table - memory, single query.',

    script: `DROP TABLE IF EXISTS ${TABLE1};`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 10,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE1}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 0
    }],
    readMem: [{
      "COUNT(*)": 0
    }],

    isSkip: false,
  }, {
    id: 11,
    name: 'Drop table - file only, single query.',

    script: `DROP TABLE IF EXISTS ${TABLE2};`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 11,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE2}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 0,
    }],
    readMem: [{
      "COUNT(*)": 0,
    }],

    isSkip: false,
  }, {
    id: 12,
    name: 'Create table repeat - memory, single query.',

    script: `CREATE TABLE IF NOT EXISTS ${TABLE1}
(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "value" VARCHAR NOT NULL
);`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 12,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE1}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 1,
    }],

    isSkip: false,
  }, {
    id: 13,
    name: 'Create table repeat - file only, single query.',

    script:
      `UPDATE ${VARS_TABLE} SET value = 0 WHERE name = "${Variable.isMemory}";
      CREATE TABLE IF NOT EXISTS ${TABLE2} (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "value" VARCHAR NOT NULL
      );`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 13,
          resultsAdd: [],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM sqlite_master WHERE name = "${TABLE2}";`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 1,
    }],
    readMem: [{
      "COUNT(*)": 0,
    }],

    isSkip: false,
  },
  /* #endregion */

  /* #region One-shot data management with repeats. */
  {
    id: 14,
    name: 'Insert - memory, repeated single query.',

    script: `INSERT INTO ${TABLE1} ("value") VALUES ("test") RETURNING *;`,
    args: [] as any[],
    repeat: 2,

    results: [
      [
        {
          id: 14,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE1,
              rows: [
                {
                  id: 1,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [] as any[],
          resultsGet: [
            {
              autoKeys: [] as any[],
              keys: [] as any[],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  id: 1,
                  value: "test"
                }
              ]
            }
          ],
          resultsSet: [] as any[],
          error: undefined as any,
          isCancel: false,
          isWait: false,
        }
      ],
      [
        {
          id: 15,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE1,
              rows: [
                {
                  id: 2,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [
            {
              autoKeys: [],
              keys: [],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  id: 2,
                  value: "test"
                }
              ]
            }
          ],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: false,
    isSkip: false,
  }, {
    id: 15,
    name: 'Insert - file only, repeated single query.',

    script: `INSERT INTO ${TABLE2} ("value") VALUES ("test") RETURNING *;`,
    args: [],
    repeat: 2,

    results: [
      [
        {
          id: 16,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE2,
              rows: [
                {
                  id: 1,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [
            {
              autoKeys: [],
              keys: [],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  id: 1,
                  value: "test"
                }
              ]
            }
          ],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ],
      [
        {
          id: 17,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE2,
              rows: [
                {
                  id: 2,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [
            {
              autoKeys: [],
              keys: [],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  id: 2,
                  value: "test"
                }
              ]
            }
          ],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: false,
    isSkip: false,
  }, {
    id: 16,
    name: 'Read only - memory, single query.',

    script: `SELECT * FROM ${TABLE1};`,
    args: [] as any[],
    repeat: 1,

    results: [
      [
        {
          id: -1,
          resultsAdd: [] as any[],
          resultsDel: [] as any[],
          resultsGet: [
            {
              autoKeys: [] as any[],
              keys: [] as any[],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  id: 1,
                  value: "test"
                },
                {
                  id: 2,
                  value: "test"
                }
              ]
            }
          ],
          resultsSet: [] as any[],
          error: undefined as any,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE1};`,
    readFile: [{
      "COUNT(*)": 2,
    }],

    isMemory: true,
    readMem: [{
      "COUNT(*)": 2,
    }],

    isSkip: false,
  }, {
    id: 17,
    name: 'Read only - file only, single query.',

    script: `SELECT * FROM ${TABLE2};`,
    args: [] as any[],
    repeat: 1,

    results: [
      [
        {
          id: -1,
          resultsAdd: [] as any[],
          resultsDel: [] as any[],
          resultsGet: [
            {
              autoKeys: [] as any[],
              keys: [] as any[],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  id: 1,
                  value: "test"
                },
                {
                  id: 2,
                  value: "test"
                }
              ]
            }
          ],
          resultsSet: [] as any[],
          error: undefined as any,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE2};`,
    readFile: [{
      "COUNT(*)": 2,
    }],

    isMemory: false,
    isSkip: false,
  },
  /* #endregion */

  /* #region Interactive transactions. */
  {
    id: 18,
    name: 'Insert & wait - memory, single query.',

    script: `
      BEGIN TRANSACTION;
      INSERT INTO ${TABLE1} ("value") VALUES ("test");
    `,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 18,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE1,
              rows: [
                {
                  id: 3,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: true,
        }
      ],
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE1};`,

    isMemory: false,
    readFile: [{
      "COUNT(*)": 2,
    }],

    isSkip: false,
  }, {
    id: 19,
    name: 'Insert & wait - memory, single query.',

    script: `INSERT INTO ${TABLE1} ("value") VALUES ("test");`,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 18,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE1,
              rows: [
                {
                  id: 4,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: true,
        }
      ],
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE1};`,

    isMemory: false,
    readFile: [{
      "COUNT(*)": 2,
    }],

    isSkip: false,
  }, {
    id: 20,
    name: 'Read only & commit - memory, single query.',

    script: `SELECT COUNT(*) FROM ${TABLE1}; COMMIT;`,
    args: [] as any[],
    repeat: 1,

    results: [
      [
        {
          id: 18,
          resultsAdd: [] as any[],
          resultsDel: [] as any[],
          resultsGet: [
            {
              autoKeys: [] as any[],
              keys: [] as any[],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  "COUNT(*)": 4
                }
              ]
            }
          ],
          resultsSet: [] as any[],
          error: undefined as any,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE1};`,
    readFile: [{
      "COUNT(*)": 4,
    }],

    isMemory: true,
    readMem: [{
      "COUNT(*)": 4,
    }],

    isSkip: false,
  }, {
    id: 21,
    name: 'Insert & wait - file only, single query.',

    script: `
      BEGIN TRANSACTION;
      INSERT INTO ${TABLE2} ("value") VALUES ("test");
    `,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 19,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE2,
              rows: [
                {
                  id: 3,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: true,
        }
      ],
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE2};`,

    isMemory: false,
    readFile: [{
      "COUNT(*)": 2,
    }],

    isSkip: false,
  }, {
    id: 22,
    name: 'Insert & wait - file only, single query, repeat begin query issue.',

    script: `
      BEGIN TRANSACTION;
      INSERT INTO ${TABLE2} ("value") VALUES ("test");
    `,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 19,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE2,
              rows: [
                {
                  id: 4,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: true,
        }
      ],
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE2};`,

    isMemory: false,
    readFile: [{
      "COUNT(*)": 2,
    }],

    isSkip: false,
  }, {
    id: 23,
    name: 'Read only & commit - file only, single query.',

    script: `SELECT COUNT(*) FROM ${TABLE2}; COMMIT;`,
    args: [] as any[],
    repeat: 1,

    results: [
      [
        {
          id: 19,
          resultsAdd: [] as any[],
          resultsDel: [] as any[],
          resultsGet: [
            {
              autoKeys: [] as any[],
              keys: [] as any[],
              method: Method.get,
              name: "STARK_RESULT_1",
              rows: [
                {
                  "COUNT(*)": 4
                }
              ]
            }
          ],
          resultsSet: [] as any[],
          error: undefined as any,
          isCancel: false,
          isWait: false,
        }
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE2};`,
    readFile: [{
      "COUNT(*)": 4,
    }],

    isMemory: false,
    isSkip: false,
  },
  /* #endregion */

  /* #region Multiple commits. */
  {
    id: 24,
    name: 'Insert - File & memory, multiple commits.',

    script: `
      BEGIN TRANSACTION;
        INSERT INTO ${TABLE2} ("value") VALUES ("test");
      COMMIT;

      BEGIN TRANSACTION;
        INSERT INTO ${TABLE1} ("value") VALUES ("test");
      COMMIT;
    `,
    args: [],
    repeat: 1,

    results: [
      [
        {
          id: 20,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE2,
              rows: [
                {
                  id: 5,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }, {
          id: 21,
          resultsAdd: [
            {
              autoKeys: ["id"],
              keys: ["id"],
              method: Method.add,
              name: TABLE1,
              rows: [
                {
                  id: 5,
                  value: "test"
                }
              ]
            }
          ],
          resultsDel: [],
          resultsGet: [],
          resultsSet: [],
          error: undefined,
          isCancel: false,
          isWait: false,
        }, 
      ]
    ],

    isRead: true,
    resultsScript:
      `SELECT COUNT(*) FROM ${TABLE1};`,

    isMemory: true,
    readFile: [{
      "COUNT(*)": 5,
    }],
    readMem: [{
      "COUNT(*)": 5,
    }],

    isSkip: false,
  },
  /* #endregion */
];

/* #region Manage both file and memory database. */
let fileDB: DataSource;
let memDB: DataSource;

let inFileDB: DataSource;

let worker: StarkWorker;

const beforeAll = async () => {
  /* #region Create the databases. */
  if (existsSync(DB_PATH_FILE)) { rmSync(DB_PATH_FILE); }

  fileDB = getDBConnection(DB_PATH_FILE, Target.DB, [VariableEntity, Table]);
  memDB = getDBConnection(DB_PATH_FILE_MEM, Target.mem);

  await fileDB.initialize();
  await memDB.initialize();

  const isDiff = new VariableObject({ DB: fileDB});
  await isDiff.save({ name: Variable.isDiff, value: true });
  const isMemory = new VariableObject({ DB: fileDB });
  await isMemory.save({ name: Variable.isMemory, value: true });
  const isChanged = new VariableObject({ DB: fileDB });
  await isChanged.save({ name: Variable.isChanged, value: false });
  const changeCount = new VariableObject({ DB: fileDB });
  await changeCount.save({ name: Variable.changeCount, value: ZERO });

  await fileDB.query(`PRAGMA user_version = ${DB_IDENTIFIER};`);
  /* #endregion */

  worker = new StarkWorker({
    DB: fileDB,
    DBMem: memDB,
    id: ZERO,
    name: DB_FILE
  });

  await worker.init();

  inFileDB = getDBConnection(DB_PATH_FILE, Target.DB, [VariableEntity, Table]);
  await inFileDB.initialize();
};

const afterAll = async () => {
  await fileDB.destroy();
  await memDB.destroy();

  await inFileDB.destroy();
  
  await worker.destroy();
};
/* #endregion */

describe('Server: Worker Raw.', function () {
  // this.timeout(600e3);
  // this.timeout(5e3);

  before(beforeAll);
  after(afterAll);

  for (const test of tests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      for (let i = ZERO; i < test.repeat; i++) {
        // Test the returned results.
        const testResults = (await worker.add(test.script, test.args))
          .map((result) => result.toObject());

        assert.deepEqual(testResults, test.results[i]);

        // Wait for the DB.
        await setTimeout(1e2);

        if (!test.isRead) { continue; }

        const readFile = await inFileDB.query(test.resultsScript, []);
        assert.deepEqual(readFile, test.readFile);

        if (!test.isMemory) { continue; }

        const readMem = await memDB.query(test.resultsScript);
        assert.deepEqual(readMem, test.readMem);
      }
    });
  }
});