import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';

import { ParseType } from '../../src/parser/queryParse';
import { CommitPart } from '../../src/parser/commitPart';
import { DB_DRIVER, ONE, TABLES_TABLE, Target, VARS_TABLE, ZERO } from '../../src/utils/constants';
import { Method } from '../../src/utils/method';
import { COMMIT_END, COMMIT_START } from '../../src/utils/queries';
import { Variable } from '../../src/utils/variable';

const DB_PATH = './test';
const DB_FILE = 'test-commitPart.db';
const DB_PATH_FILE = resolve(DB_PATH, DB_FILE);

const TABLE1 = 'test_data1';

const tests = [
  {
    id: 0,
    name: 'init',
    parts: [],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: true,
      isWait: true,
      params: [],
      script: "",
    },
    isSkip: false
  }, {
    id: 1,
    name: 'begin transaction',
    parts: [
      {
        script: COMMIT_START,
        params: [],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: true,
      isWait: true,
      params: [],
      script: COMMIT_START,
    },
    isSkip: false
  }, {
    id: 2,
    name: 'single query',
    parts: [
      {
        script: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: true,
      isWait: true,
      params: [ONE],
      script: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
    },
    isSkip: false
  }, {
    id: 3,
    name: 'multiple queries',
    parts: [
      {
        script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: true,
      isWait: true,
      params: [ONE],
      script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
    },
    isSkip: false
  }, {
    id: 4,
    name: 'multiple parts',
    parts: [
      {
        script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM test_data1 WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }, {
        script: `INSERT INTO ${TABLE1} (id, value) VALUES (2, "test2");
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [] as unknown[],
            isRead: false,
            autoKeys: [] as unknown[],
            keys: [] as unknown[],
            params: [] as unknown[],
            query: `INSERT INTO ${TABLE1} (id, value) VALUES (2, "test2");`,
            tablesRead: [] as unknown[],
            tablesWrite: [TABLE1],
            type: ParseType.modify_data
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: false,
      isWait: true,
      params: [ONE, ONE],
      script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;
INSERT INTO ${TABLE1} (id, value) VALUES (2, "test2");
SELECT value FROM ${TABLE1} WHERE id = ?;`,
    },
    isSkip: false
  }, {
    id: 5,
    name: 'multiple parts 2',
    parts: [
      {
        script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM test_data1 WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }, {
        script: `SELECT value FROM ${TABLE1} WHERE id = ?;
INSERT INTO ${TABLE1} (id, value) VALUES (2, "test2");`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `INSERT INTO ${TABLE1} (id, value) VALUES (2, "test2");`,
            tablesRead: [],
            tablesWrite: [TABLE1],
            type: ParseType.modify_data
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: false,
      isWait: true,
      params: [ONE, ONE],
      script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;
SELECT value FROM ${TABLE1} WHERE id = ?;
INSERT INTO ${TABLE1} (id, value) VALUES (2, "test2");`,
    },
    isSkip: false
  }, {
    id: 6,
    name: 'multiple parts 3, add flags',
    parts: [
      {
        script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }, {
        script: `INSERT INTO ${VARS_TABLE} (name, value) VALUES ("${Variable.isDiff}", 1);
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: true,
      isMemory: true,
      isReadOnly: true,
      isWait: true,
      params: [ONE, ONE],
      script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;
SELECT value FROM ${TABLE1} WHERE id = ?;`,
    },
    isSkip: false
  }, {
    id: 7,
    name: 'multiple parts 3, add flags 2',
    parts: [
      {
        script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }, {
        script: `SELECT value FROM ${TABLE1} WHERE id = ?;
INSERT INTO ${VARS_TABLE} (name, value) VALUES ("${Variable.isDiff}", 1);`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: true,
      isMemory: true,
      isReadOnly: true,
      isWait: true,
      params: [ONE, ONE],
      script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;
SELECT value FROM ${TABLE1} WHERE id = ?;`,
    },
    isSkip: false
  }, {
    id: 8,
    name: 'multiple parts 3, add flags & commit',
    parts: [
      {
        script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }, {
        script: `INSERT INTO ${VARS_TABLE} (name, value) VALUES ("${Variable.isDiff}", 1);
SELECT value FROM ${TABLE1} WHERE id = ?;
${COMMIT_END};`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_END,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.commit_transaction
          }
        ]
      }
    ],
    resultSave: {
      isNotLog: true,
      isMemory: true,
      isReadOnly: true,
      isWait: false,
      params: [ONE, ONE],
      script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;
SELECT value FROM ${TABLE1} WHERE id = ?;
${COMMIT_END}`,
    },
    isSkip: false
  }, {
    id: 9,
    name: 'table add, single query',
    parts: [
      {
        script: `CREATE TABLE IF NOT EXISTS "${TABLE1}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);`,
        params: [],
        result: [
          {
            columns: ["id", "value"],
            isRead: false,
            autoKeys: ["id"],
            keys: ["id"],
            params: [],
            query: `CREATE TABLE IF NOT EXISTS "${TABLE1}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);`,
            tablesRead: [],
            tablesWrite: [TABLE1],
            type: ParseType.create_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.add}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.add}_${TABLE1}`],
            type: ParseType.drop_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.del}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.del}_${TABLE1}`],
            type: ParseType.drop_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.set}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.set}_${TABLE1}`],
            type: ParseType.drop_table,
          },
          {
            columns: [
              "id",
              "value",
            ],
            isRead: false,
            autoKeys: ["id"],
            keys: ["id"],
            params: [],
            query: `CREATE TABLE IF NOT EXISTS "_stark_diffs_${Method.add}_${TABLE1}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.add}_${TABLE1}`],
            type: ParseType.create_table,
          },
          {
            columns: [
              "id",
              "value",
            ],
            isRead: false,
            autoKeys: ["id"],
            keys: ["id"],
            params: [],
            query: `CREATE TABLE IF NOT EXISTS "_stark_diffs_${Method.del}_${TABLE1}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.del}_${TABLE1}`],
            type: ParseType.create_table,
          },
          {
            columns: [
              "id",
              "value",
            ],
            isRead: false,
            autoKeys: ["id"],
            keys: ["id"],
            params: [],
            query: `CREATE TABLE IF NOT EXISTS "_stark_diffs_${Method.set}_${TABLE1}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.set}_${TABLE1}`],
            type: ParseType.create_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.add}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.del}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.set}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: true,
            autoKeys: [],
            keys: [],
            params: [],
            query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_${Method.add}_${TABLE1}
  AFTER INSERT
  ON ${TABLE1}
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.isDiff}") IN (1)
BEGIN
  INSERT INTO _stark_diffs_${Method.add}_${TABLE1}
    VALUES (NEW.id, NEW.value);
  UPDATE ${VARS_TABLE}
    SET value = value + 1
    WHERE name = 'changeCount';
  UPDATE ${TABLES_TABLE}
    SET changeCount = changeCount + 1
    WHERE name = '${TABLE1}';
END;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: true,
            autoKeys: [],
            keys: [],
            params: [],
            query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_${Method.del}_${TABLE1}
  AFTER DELETE
  ON ${TABLE1}
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.isDiff}") IN (1)
BEGIN
  INSERT INTO _stark_diffs_${Method.del}_${TABLE1}
    VALUES (OLD.id, OLD.value);
  UPDATE ${VARS_TABLE}
    SET value = value + 1
    WHERE name = 'changeCount';
  UPDATE ${TABLES_TABLE}
    SET changeCount = changeCount + 1
    WHERE name = '${TABLE1}';
END;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: true,
            autoKeys: [],
            keys: [],
            params: [],
            query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_${Method.set}_${TABLE1}
  AFTER UPDATE
  ON ${TABLE1}
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.isDiff}") IN (1)
BEGIN
  INSERT INTO _stark_diffs_${Method.set}_${TABLE1}
    VALUES (NEW.id, NEW.value);
  UPDATE ${VARS_TABLE}
    SET value = value + 1
    WHERE name = 'changeCount';
  UPDATE ${TABLES_TABLE}
    SET changeCount = changeCount + 1
    WHERE name = '${TABLE1}';
END;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [
              TABLE1,
              `["id"]`,
              `["id"]`,
              ONE,
              ZERO,
            ],
            query: `REPLACE INTO ${TABLES_TABLE} VALUES (?, ?, ?, ?, ?);`,
            tablesRead: [],
            tablesWrite: [TABLES_TABLE],
            type: ParseType.modify_data,
          },
        ]
      }
    ],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: false,
      isWait: true,
      params: [],
      script: `CREATE TABLE IF NOT EXISTS "${TABLE1}" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);`,
    },
    isSkip: false
  }, {
    id: 10,
    name: 'table modification, multiple queries',
    parts: [
      {
        script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;`,
        params: [ONE],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: COMMIT_START,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.begin_transaction
          }, {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [ONE],
            query: `SELECT value FROM ${TABLE1} WHERE id = ?;`,
            tablesRead: [TABLE1],
            tablesWrite: [],
            type: ParseType.select_data
          }
        ]
      }, {
        script: `ALTER TABLE ${TABLE1} RENAME TO "variables2";
${COMMIT_END};`,
        params: [],
        result: [
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `ALTER TABLE ${TABLE1} RENAME TO "variables2";`,
            tablesRead: [],
            tablesWrite: [
              TABLE1,
              "variables2",
            ],
            type: ParseType.rename_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.add}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            keys: [],
            autoKeys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.del}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            keys: [],
            autoKeys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.set}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            keys: [],
            autoKeys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.add}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.add}_${TABLE1}`],
            type: ParseType.drop_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.del}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.del}_${TABLE1}`],
            type: ParseType.drop_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.set}_${TABLE1};`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.set}_${TABLE1}`],
            type: ParseType.drop_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [
              "variables2",
              TABLE1,
            ],
            query: `UPDATE ${TABLES_TABLE} SET name = ? WHERE name = ?;`,
            tablesRead: [],
            tablesWrite: [TABLES_TABLE],
            type: ParseType.modify_data,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.add}_variables2;`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.add}_variables2`],
            type: ParseType.drop_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.del}_variables2;`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.del}_variables2`],
            type: ParseType.drop_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TABLE IF EXISTS _stark_diffs_${Method.set}_variables2;`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.set}_variables2`],
            type: ParseType.drop_table,
          },
          {
            columns: [
              "id",
              "value",
            ],
            isRead: false,
            autoKeys: ["id"],
            keys: ["id"],
            params: [],
            query: `CREATE TABLE "_stark_diffs_${Method.add}_variables2"
      (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "value" VARCHAR NOT NULL
      );`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.add}_variables2`],
            type: ParseType.create_table,
          },
          {
            columns: [
              "id",
              "value",
            ],
            isRead: false,
            autoKeys: ["id"],
            keys: ["id"],
            params: [],
            query: `CREATE TABLE "_stark_diffs_${Method.del}_variables2"
      (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "value" VARCHAR NOT NULL
      );`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.del}_variables2`],
            type: ParseType.create_table,
          },
          {
            columns: [
              "id",
              "value",
            ],
            isRead: false,
            autoKeys: ["id"],
            keys: ["id"],
            params: [],
            query: `CREATE TABLE "_stark_diffs_${Method.set}_variables2"
      (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "value" VARCHAR NOT NULL
      );`,
            tablesRead: [],
            tablesWrite: [`_stark_diffs_${Method.set}_variables2`],
            type: ParseType.create_table,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.add}_variables2;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.del}_variables2;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: `DROP TRIGGER IF EXISTS _stark_trigger_${Method.set}_variables2;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: true,
            autoKeys: [],
            keys: [],
            params: [],
            query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_${Method.add}_variables2
  AFTER INSERT
  ON variables2
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.isDiff}") IN (1)
BEGIN
  INSERT INTO _stark_diffs_${Method.add}_variables2
    VALUES (NEW.id, NEW.value);
  UPDATE ${VARS_TABLE}
    SET value = value + 1
    WHERE name = 'changeCount';
  UPDATE ${TABLES_TABLE}
    SET changeCount = changeCount + 1
    WHERE name = 'variables2';
END;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: true,
            autoKeys: [],
            keys: [],
            params: [],
            query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_${Method.del}_variables2
  AFTER DELETE
  ON variables2
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.isDiff}") IN (1)
BEGIN
  INSERT INTO _stark_diffs_${Method.del}_variables2
    VALUES (OLD.id, OLD.value);
  UPDATE ${VARS_TABLE}
    SET value = value + 1
    WHERE name = 'changeCount';
  UPDATE ${TABLES_TABLE}
    SET changeCount = changeCount + 1
    WHERE name = 'variables2';
END;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: true,
            autoKeys: [],
            keys: [],
            params: [],
            query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_${Method.set}_variables2
  AFTER UPDATE
  ON variables2
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.isDiff}") IN (1)
BEGIN
  INSERT INTO _stark_diffs_${Method.set}_variables2
    VALUES (NEW.id, NEW.value);
  UPDATE ${VARS_TABLE}
    SET value = value + 1
    WHERE name = 'changeCount';
  UPDATE ${TABLES_TABLE}
    SET changeCount = changeCount + 1
    WHERE name = 'variables2';
END;`,
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.other,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [
              "variables2",
              `["id"]`,
              `["id"]`,
              ONE,
              ZERO,
            ],
            query: `REPLACE INTO ${TABLES_TABLE} VALUES (?, ?, ?, ?, ?);`,
            tablesRead: [],
            tablesWrite: [TABLES_TABLE],
            type: ParseType.modify_data,
          },
          {
            columns: [],
            isRead: false,
            autoKeys: [],
            keys: [],
            params: [],
            query: "COMMIT TRANSACTION;",
            tablesRead: [],
            tablesWrite: [],
            type: ParseType.commit_transaction,
          },
        ]
      }
    ],
    resultSave: {
      isNotLog: false,
      isMemory: true,
      isReadOnly: false,
      isWait: false,
      params: [ONE],
      script: `${COMMIT_START}
SELECT value FROM ${TABLE1} WHERE id = ?;
ALTER TABLE ${TABLE1} RENAME TO \"variables2\";
${COMMIT_END}`,
    },
    isSkip: false
  },
];

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

  await memDB.query(
    `
      CREATE TABLE IF NOT EXISTS "${TABLE1}"
      (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "value" VARCHAR NOT NULL
      );
    `
  );

};

const afterAllMem = async () => {
  await memDB.destroy();
};
/* #endregion */

describe('CommitPart: DB - Load & Save.', function () {
  // this.timeout(600e3);

  before(beforeAllMem);
  after(afterAllMem);

  for (const test of tests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const commitPart = new CommitPart({
        DB: memDB,
        target: Target.DB,
        tables: new Set([TABLE1])
      });

      for (const part of test.parts) {
        const resultLoad = (await commitPart.add(part.script, part.params))
          .map((commit) => commit.toObject());
      
        assert.deepEqual(resultLoad, part.result);
      }

      const resultSave = commitPart.get();
      assert.deepEqual(resultSave, test.resultSave);
    });
  }
});