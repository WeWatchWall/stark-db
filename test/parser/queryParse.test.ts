import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ParseType, QueryParse } from '../../src/parser/queryParse';

const tests = [
  /* #region  Transactions. */
  // https://www.sqlite.org/lang_transaction.html
  {
    id: 0,
    name: 'Query Transaction - begin',
    query: 'BEGIN;',
    result: {
      isRead: false,
      query: 'BEGIN;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.begin_transaction
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Query Transaction - begin trim',
    query: '\n  BEGIN;',
    result: {
      isRead: false,
      query: 'BEGIN;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 2,
    name: 'Query Transaction - begin long',
    query: 'BEGIN TRANSACTION;',
    result: {
      isRead: false,
      query: 'BEGIN TRANSACTION;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 3,
    name: 'Query Transaction - rollback',
    query: 'ROLLBACK;',
    result: {
      isRead: false,
      query: 'ROLLBACK;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 4,
    name: 'Query Transaction - rollback long',
    query: 'ROLLBACK TRANSACTION;',
    result: {
      isRead: false,
      query: 'ROLLBACK TRANSACTION;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 5,
    name: 'Query Transaction - commit',
    query: 'COMMIT;',
    result: {
      isRead: false,
      query: 'COMMIT;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 6,
    name: 'Query Transaction - commit long',
    query: 'COMMIT TRANSACTION;',
    result: {
      isRead: false,
      query: 'COMMIT TRANSACTION;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 7,
    name: 'Query Transaction - end',
    query: 'END;',
    result: {
      isRead: false,
      query: 'END;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 8,
    name: 'Query Transaction - end long',
    query: 'END TRANSACTION;',
    result: {
      isRead: false,
      query: 'END TRANSACTION;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  },
  /* #endregion */

  /* #region  Tables. */
  // https://www.sqlite.org/lang_createtable.html
  {
    id: 9,
    name: 'Query Table - create',
    query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);',
    result: {
      isRead: false,
      query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "value" text NOT NULL);',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: ["id", "value"],
      autoKeys: ["id"],
      keys: ["id"],
      type: ParseType.create_table,
    },
  }, {
    id: 10,
    name: 'Query Table - create multiple keys',
    query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" INTEGER NOT NULL, "type" varchar NOT NULL, "value" text NOT NULL, PRIMARY KEY("id", "type"));',
    result: {
      isRead: false,
      query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" INTEGER NOT NULL, "type" varchar NOT NULL, "value" text NOT NULL, PRIMARY KEY("id", "type"));',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: ["id", "type", "value"],
      autoKeys: [],
      keys: ["id", "type"],
      type: ParseType.create_table,
    }
  }, {
    id: 11,
    name: 'Query Table - create temp',
    query: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
    result: {
      isRead: false,
      query: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: ["id", "value"],
      autoKeys: [],
      keys: ["id"],
      type: ParseType.create_table,
    }
  }, {
    id: 12,
    name: 'Query Data - create table with select.',
    query: 'CREATE TABLE variables AS SELECT * FROM variables2;',
    result: {
      isRead: true,
      query: 'CREATE TABLE variables AS SELECT * FROM variables2;',
      params: [],
      tablesRead: ["variables2"],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.create_table,
    },
    isSkip: false
  }, {
    id: 13,
    name: 'Query Table - drop',
    query: 'DROP TABLE "variables";',
    result: {
      isRead: false,
      query: 'DROP TABLE "variables";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.drop_table,
    }
  }, {
    id: 14,
    name: 'Query Table - drop conditional',
    query: 'DROP TABLE IF EXISTS "variables";',
    result: {
      isRead: false,
      query: 'DROP TABLE IF EXISTS "variables";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.drop_table,
    }
  },

  // https://www.sqlite.org/lang_altertable.html
  {
    id: 15,
    name: 'Query Table - rename',
    query: 'ALTER TABLE "variables" RENAME TO "variables2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" RENAME TO "variables2";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables", "variables2"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.rename_table
    }
  }, {
    id: 16,
    name: 'Query Table - TODO: rename column',
    query: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
      params: [] as any[],
      tablesRead: [] as string[],
      tablesWrite: ["variables2", "variables"],
      columns: ["value", "value2"],
      autoKeys: [] as string[],
      keys: [] as string[],
      type: ParseType.rename_table,
    },
    isSkip: true
  }, {
    id: 17,
    name: 'Query Table - add column',
    query: 'ALTER TABLE "variables" ADD "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" ADD "value2";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: ["value2"],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_table_columns
    }
  }, {
    id: 18,
    name: 'Query Table - add column long',
    query:
      'ALTER TABLE "variables" ADD COLUMN "value2" VARCHAR PRIMARY KEY;',
    result: {
      isRead: false,
      query:
        'ALTER TABLE "variables" ADD COLUMN "value2" VARCHAR PRIMARY KEY;',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: ["value2"],
      autoKeys: [],
      keys: ["value2"],
      type: ParseType.modify_table_columns,
    }
  }, {
    id: 19,
    name: 'Query Table - TODO: drop column',
    query: 'ALTER TABLE "variables" DROP "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" DROP "value2";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: ["value2"],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_table_columns,
    },
    isSkip: true
  }, {
    id: 20,
    name: 'Query Table - TODO: drop column long',
    query: 'ALTER TABLE "variables" DROP COLUMN "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" DROP COLUMN "value2";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: ["value2"],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_table_columns,
    },
    isSkip: true
  },
  /* #endregion */

  /* #region  Data. */
  {
    id: 21,
    name: 'Query Data - insert',
    query: 'INSERT INTO variables (id, value) VALUES ("isWAL", 1);',
    result: {
      isRead: false,
      query: 'INSERT INTO variables (id, value) VALUES ("isWAL", 1);',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data,
    }
  }, {
    id: 22,
    name: 'Query Data - insert with select.',
    query: 'INSERT INTO variables SELECT * FROM variables2;',
    result: {
      isRead: true,
      query: 'INSERT INTO variables SELECT * FROM variables2;',
      params: [] as any[],
      tablesRead: ["variables2"],
      tablesWrite: ["variables"],
      columns: [] as string[],
      autoKeys: [] as string[],
      keys: [] as string[],
      type: ParseType.modify_data
    }
  }, {
    id: 23,
    name: 'Query Data - upsert',
    query: 'INSERT OR REPLACE INTO variables (id, value) VALUES ("isWAL", 1);',
    result: {
      isRead: false,
      query: 'INSERT OR REPLACE INTO variables (id, value) VALUES ("isWAL", 1);',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 24,
    name: 'Query Data - UPSERT with select.',
    query: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
    result: {
      isRead: true,
      query: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
      params: [],
      tablesRead: ["variables2"],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data
    },
    isSkip: false
  }, {
    id: 25,
    name: 'Query Data - update',
    query: 'UPDATE variables SET value = "new";',
    result: {
      isRead: false,
      query: 'UPDATE variables SET value = "new";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 26,
    name: 'Query Data - update with select',
    query: 'UPDATE variables SET value = "new" WHERE id IN (SELECT id FROM variables2);',
    result: {
      isRead: true,
      query: 'UPDATE variables SET value = "new" WHERE id IN (SELECT id FROM variables2);',
      params: [],
      tablesRead: ["variables2"],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 27,
    name: 'Query Data - delete',
    query: 'DELETE FROM variables WHERE value = "new";',
    result: {
      isRead: false,
      query: 'DELETE FROM variables WHERE value = "new";',
      params: [],
      tablesRead: [],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.delete_data
    }
  }, {
    id: 28,
    name: 'Query Data - select',
    query: 'SELECT * FROM variables WHERE value = "new";',
    result: {
      isRead: false,
      query: 'SELECT * FROM variables WHERE value = "new";',
      params: [],
      tablesRead: ["variables"],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.select_data
    }
  }, {
    id: 29,
    name: 'Query Data - select with join',
    query: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
    result: {
      isRead: false,
      query: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
      params: [],
      tablesRead: ["variables", "variables2"],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.select_data
    }
  },
  /* #endregion */

  /* #region  Data - Common Table Expressions. */
  {
    id: 30,
    name: 'CTE - insert with select.',
    query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) INSERT INTO variables SELECT * FROM twoCol;',
    result: {
      isRead: true,
      query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) INSERT INTO variables SELECT * FROM twoCol;',
      params: [],
      tablesRead: ["twocol"],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 31,
    name: 'CTE - update with select',
    query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) UPDATE variables SET value = "new" WHERE id IN (SELECT a FROM twoCol);',
    result: {
      isRead: true,
      query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) UPDATE variables SET value = "new" WHERE id IN (SELECT a FROM twoCol);',
      params: [],
      tablesRead: ["twocol"],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 31,
    name: 'CTE - update with select',
    query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) UPDATE variables SET value = "new" WHERE id IN (SELECT a FROM twoCol);',
    result: {
      isRead: true,
      query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) UPDATE variables SET value = "new" WHERE id IN (SELECT a FROM twoCol);',
      params: [],
      tablesRead: ["twocol"],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 32,
    name: 'CTE - delete',
    query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) DELETE FROM variables WHERE id IN (SELECT a FROM twoCol);',
    result: {
      isRead: true,
      query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) DELETE FROM variables WHERE id IN (SELECT a FROM twoCol);',
      params: [],
      tablesRead: ["twocol"],
      tablesWrite: ["variables"],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.delete_data
    }
  }, {
    id: 33,
    name: 'CTE - select',
    query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) SELECT * FROM twoCol;',
    result: {
      isRead: true, // Inconsistent.
      query: 'WITH twoCol( a, b ) AS ( SELECT 1, 2 ) SELECT * FROM twoCol;',
      params: [],
      tablesRead: ["twocol"],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.select_data
    }
  }, {
    id: 34,
    name: 'CTE - select',
    query: 'WITH twoCol( a, b ) AS ( SELECT * FROM variables ) SELECT * FROM twoCol;',
    result: {
      isRead: true, // Inconsistent.
      query: 'WITH twoCol( a, b ) AS ( SELECT * FROM variables ) SELECT * FROM twoCol;',
      params: [],
      tablesRead: ["twocol", "variables"],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.select_data
    }
  },
  /* #endregion */

  /* #region  Other. */
  {
    id: 35,
    name: 'Query Other - add pragma',
    query: 'PRAGMA pragma_name = value;',
    result: {
      isRead: false,
      query: 'PRAGMA pragma_name = value;',
      params: [],
      tablesRead: [],
      tablesWrite: [],
      columns: [],
      autoKeys: [],
      keys: [],
      type: ParseType.other
    }
  },
  /* #endregion */
];

describe('Queries.', function () {
  for (const test of tests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const statement = new QueryParse({
        query: test.query,
        params: []
      });
      statement.validator.ready();

      // Copy and cleanup the statement.
      const result = statement.toObject();

      assert.deepEqual(result, test.result);
    });
  }
});