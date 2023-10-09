import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';

import { CommitArg } from '../../src/parser/commit';
import { CommitList } from '../../src/parser/commitList';
import { ParseType } from '../../src/parser/queryParse';
import { DB_DRIVER, Target, VARS_TABLE, ZERO } from '../../src/utils/constants';
import { Variable } from '../../src/utils/variable';
import { COMMIT_START } from '../../src/utils/queries';

const DB_PATH = './test';
const DB_FILE = 'test-commitList.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);

/* #region Manage the memory database. */
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
};

const afterAllMem = async () => {
  await memDB.destroy();
};
/* #endregion */

const tests = [
  /* #region  Split transactions. */
  {
    id: 0,
    name: 'Empty',
    script: '',
    params: [],
    result: {
      script: '',
      params: [],
      commitParts: [],
      isNotLog: false,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Split - Missing start & end transaction',
    script: `SELECT * FROM user;`,
    params: [] as unknown[],
    result: {
      script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
      params: [] as unknown[],
      commitParts: [
        {
          script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
          params: [] as unknown[],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [] as unknown[],
              query: "SELECT * FROM user;",
              tablesRead: [
                "user"
              ],
              tablesWrite: [] as unknown[],
              columns: [] as unknown[],
              autoKeys: [] as unknown[],
              keys: [] as unknown[],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: false,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 2,
    name: 'Split - Missing start transaction',
    script: `SELECT * FROM user;
COMMIT TRANSACTION;`,
    params: [],
    result: {
      script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tablesRead: [
                "user"
              ],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: false,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 3,
    name: 'Split - Missing end transaction',
    script: `${COMMIT_START}
SELECT * FROM user;`,
    params: [],
    result: {
      script: `${COMMIT_START}
SELECT * FROM user;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
SELECT * FROM user;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tablesRead: [
                "user"
              ],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.select_data
            },
          ]
        }
      ],
      isNotLog: false,
      isReadOnly: true,
      isMemory: true,
      isWait: true
    },
    isSkip: false
  }, {
    id: 4,
    name: 'Split - Missing start transaction - Multiple',
    script: `SELECT * FROM user;
COMMIT TRANSACTION;
${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
    params: [],
    result: {
      script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;
${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tablesRead: [
                "user"
              ],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }, {
          script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tablesRead: [
                "user"
              ],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: false,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 5,
    name: 'Split - Missing start & end transaction - Multiple',
    script: `SELECT * FROM user;
${COMMIT_START}
SELECT * FROM user;`,
    params: [],
    result: {
      script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;
${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tablesRead: [
                "user"
              ],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }, {
          script: `${COMMIT_START}
SELECT * FROM user;
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tablesRead: [
                "user"
              ],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: false,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  },
  /* #endregion */

  /* #region  Manage the flags. */
  // TODO: Remove empty transactions.
  {
    id: 6,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variable.isDiff}";`,
    params: [ZERO],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 7,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variable.isMemory}";`,
    params: [],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: false,
      isReadOnly: true,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 8,
    name: 'Flags - Update IN query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id IN ("${Variable.isDiff}", "${Variable.isMemory}");`,
    params: [ZERO],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 9,
    name: 'Flags - Insert or replace query',
    script: `REPLACE INTO ${VARS_TABLE} VALUES ("${Variable.isDiff}", ?);`,
    params: [],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 10,
    name: 'Flags - Params',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?);`,
    params: [Variable.isDiff, ZERO],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [] as unknown[],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [] as unknown[],
          statements: [
            {
              isRead: false,
              params: [] as unknown[],
              query: `${COMMIT_START}`,
              tablesRead: [] as unknown[],
              tablesWrite: [] as unknown[],
              columns: [] as unknown[],
              autoKeys: [] as unknown[],
              keys: [] as unknown[],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 11,
    name: 'Flags - Params 2',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?), (?, ?);`,
    params: [Variable.isDiff, ZERO, Variable.isMemory, ZERO],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [] as unknown[],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [] as unknown[],
          statements: [
            {
              isRead: false,
              params: [] as unknown[],
              query: `${COMMIT_START}`,
              tablesRead: [] as unknown[],
              tablesWrite: [] as unknown[],
              columns: [] as unknown[],
              autoKeys: [] as unknown[],
              keys: [] as unknown[],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 12,
    name: 'Flags - Params 3',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?), ("${Variable.isMemory}", ?);`,
    params: [Variable.isDiff, ZERO, ZERO],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 13,
    name: 'Flags - Params 4',
    script: `REPLACE INTO ${VARS_TABLE} VALUES ("${Variable.isMemory}", ?), (?, ?);`,
    params: [ZERO, Variable.isDiff, ZERO],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              query: `${COMMIT_START}`,
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  },
  /* #endregion */

  /* #region  Manage the schema. */
  {
    id: 14,
    name: 'Schema - Add table',
    script: `CREATE TABLE IF NOT EXISTS "variables" ("id" VARCHAR PRIMARY KEY NOT NULL, "value" text NOT NULL);`,
    params: [],
    result: {
      script: `${COMMIT_START}
CREATE TABLE IF NOT EXISTS "variables" ("id" VARCHAR PRIMARY KEY NOT NULL, "value" text NOT NULL);
COMMIT TRANSACTION;`,
      params: [],
      commitParts: [{
        script: `${COMMIT_START}
CREATE TABLE IF NOT EXISTS "variables" ("id" VARCHAR PRIMARY KEY NOT NULL, "value" text NOT NULL);
COMMIT TRANSACTION;`,
        params: [],
        statements: [{
          query: `${COMMIT_START}`,
          params: [],
          type: ParseType.begin_transaction,
          isRead: false,
          tablesRead: [],
          tablesWrite: [],
          columns: [],
          autoKeys: [],
          keys: []
        }, {
          query: `CREATE TABLE IF NOT EXISTS "variables" ("id" VARCHAR PRIMARY KEY NOT NULL, "value" text NOT NULL);`,
          params: [],
          type: ParseType.create_table,
          isRead: false,
          tablesRead: [],
          tablesWrite: ["variables"],
          columns: ["id", "value"],
          autoKeys: [],
          keys: ["id"]
        }, {
          query: `COMMIT TRANSACTION;`,
          params: [],
          type: ParseType.commit_transaction,
          isRead: false,
          tablesRead: [],
          tablesWrite: [],
          columns: [],
          autoKeys: [],
          keys: []
        }]
      }],
      isNotLog: false,
      isReadOnly: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  },
  /* #endregion */
];

describe('CommitList - Load & Save.', function () {
  // this.timeout(600e3);

  before(beforeAllMem);
  after(afterAllMem);
  
  for (const test of tests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const commits = new CommitList({
        DB: memDB,

        script: test.script,
        params: test.params,
        tables: [],
        target: Target.DB
      });

      commits.save();

      // Copy and cleanup the commits.
      const result: CommitArg = commits.toObject();

      assert.deepEqual(result, test.result);
    });
  }
});

const testsMem = [
  /* #region  Flags. */
  {
    id: 0,
    name: 'Empty',
    script: '',
    params: [],
    tables: [],
    result: {
      script: '',
      params: [],
      commitParts: [],
      isNotLog: false,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variable.isDiff}";`,
    params: [ZERO],
    tables: [VARS_TABLE],
    result: {
      script: `${COMMIT_START}
COMMIT TRANSACTION;`,
      params: [] as unknown[],
      commitParts: [
        {
          script: `${COMMIT_START}
COMMIT TRANSACTION;`,
          params: [] as unknown[],
          statements: [
            {
              isRead: false,
              params: [] as unknown[],
              query: `${COMMIT_START}`,
              tablesRead: [] as unknown[],
              tablesWrite: [] as unknown[],
              columns: [] as unknown[],
              keys: [] as unknown[],
              autoKeys: [] as unknown[],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tablesRead: [],
              tablesWrite: [],
              columns: [],
              autoKeys: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isNotLog: true,
      isReadOnly: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, 
  /* #endregion */
];


describe('CommitList Memory - Load & Save.', function () {
  // this.timeout(600e3);

  before(beforeAllMem);
  after(afterAllMem);

  for (const test of testsMem) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const commits = new CommitList({
        DB: memDB,

        script: test.script,
        params: test.params,
        tables: [],
        target: Target.mem

      });

      commits.save();

      // Copy and cleanup the commits.
      const result: CommitArg = commits.toObject();

      assert.deepEqual(result, test.result);
    });
  }
});