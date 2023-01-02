import { expect } from 'chai';
import { ParseType, QueryParse } from '../src/objects/queryParse';

const tests = [
  /* #region  Transactions. */
  // https://www.sqlite.org/lang_transaction.html
  {
    id: 0,
    name: 'Transaction - begin',
    query: 'BEGIN;',
    result: {
      isRead: false,
      query: 'BEGIN;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.begin_transaction
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Transaction - begin trim',
    query: '\n  BEGIN;',
    result: {
      isRead: false,
      query: 'BEGIN;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 2,
    name: 'Transaction - begin long',
    query: 'BEGIN TRANSACTION;',
    result: {
      isRead: false,
      query: 'BEGIN TRANSACTION;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 3,
    name: 'Transaction - rollback',
    query: 'ROLLBACK;',
    result: {
      isRead: false,
      query: 'ROLLBACK;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 4,
    name: 'Transaction - rollback long',
    query: 'ROLLBACK TRANSACTION;',
    result: {
      isRead: false,
      query: 'ROLLBACK TRANSACTION;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 5,
    name: 'Transaction - commit',
    query: 'COMMIT;',
    result: {
      isRead: false,
      query: 'COMMIT;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 6,
    name: 'Transaction - commit long',
    query: 'COMMIT TRANSACTION;',
    result: {
      isRead: false,
      query: 'COMMIT TRANSACTION;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 7,
    name: 'Transaction - end',
    query: 'END;',
    result: {
      isRead: false,
      query: 'END;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 8,
    name: 'Transaction - end long',
    query: 'END TRANSACTION;',
    result: {
      isRead: false,
      query: 'END TRANSACTION;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  },
  /* #endregion */

  /* #region  Tables. */
  // https://www.sqlite.org/lang_createtable.html
  {
    id: 9,
    name: 'Table - create',
    query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
    result: {
      isRead: false,
      query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      params: [],
      tables: ["variables"],
      columns: ["id", "value"],
      keys: ["id"],
      type: ParseType.create_table,
    }
  }, {
    id: 10,
    name: 'Table - create multiple keys',
    query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar NOT NULL, "value" text NOT NULL, PRIMARY KEY("id", "value"));',
    result: {
      isRead: false,
      query: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar NOT NULL, "value" text NOT NULL, PRIMARY KEY("id", "value"));',
      params: [],
      tables: ["variables"],
      columns: ["id", "value"],
      keys: ["id", "value"],
      type: ParseType.create_table,
    }
  }, {
    id: 11,
    name: 'Table - create temp',
    query: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
    result: {
      isRead: false,
      query: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      params: [],
      tables: ["variables"],
      columns: ["id", "value"],
      keys: ["id"],
      type: ParseType.create_table,
    }
  }, {
    id: 12,
    name: 'Data - create table with select.',
    query: 'CREATE TABLE variables AS SELECT * FROM variables2;',
    result: {
      isRead: true,
      query: 'CREATE TABLE variables AS SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      columns: [],
      keys: [],
      type: ParseType.create_table,
    },
    isSkip: false
  }, {
    id: 13,
    name: 'Table - drop',
    query: 'DROP TABLE "variables";',
    result: {
      isRead: false,
      query: 'DROP TABLE "variables";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.drop_table,
    }
  }, {
    id: 14,
    name: 'Table - drop conditional',
    query: 'DROP TABLE IF EXISTS "variables";',
    result: {
      isRead: false,
      query: 'DROP TABLE IF EXISTS "variables";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.drop_table,
    }
  },

  // https://www.sqlite.org/lang_altertable.html
  {
    id: 15,
    name: 'Table - rename',
    query: 'ALTER TABLE "variables" RENAME TO "variables2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" RENAME TO "variables2";',
      params: [],
      tables: ["variables2", "variables"],
      columns: [],
      keys: [],
      type: ParseType.rename_table
    }
  }, {
    id: 16,
    name: 'Table - TODO: rename column',
    query: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
      params: [],
      tables: ["variables2", "variables"],
      columns: ["value", "value2"],
      keys: [],
      type: ParseType.rename_table,
    },
    isSkip: true
  }, {
    id: 17,
    name: 'Table - add column',
    query: 'ALTER TABLE "variables" ADD "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" ADD "value2";',
      params: [],
      tables: ["variables"],
      columns: ["value2"],
      keys: [],
      type: ParseType.modify_table_columns
    }
  }, {
    id: 18,
    name: 'Table - add column long',
    query:
      'ALTER TABLE "variables" ADD COLUMN "value2" VARCHAR PRIMARY KEY;',
    result: {
      isRead: false,
      query:
        'ALTER TABLE "variables" ADD COLUMN "value2" VARCHAR PRIMARY KEY;',
      params: [],
      tables: ["variables"],
      columns: ["value2"],
      keys: ["value2"],
      type: ParseType.modify_table_columns,
    }
  }, {
    id: 19,
    name: 'Table - TODO: drop column',
    query: 'ALTER TABLE "variables" DROP "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" DROP "value2";',
      params: [],
      tables: ["variables"],
      columns: ["value2"],
      keys: [],
      type: ParseType.modify_table_columns,
    },
    isSkip: true
  }, {
    id: 20,
    name: 'Table - TODO: drop column long',
    query: 'ALTER TABLE "variables" DROP COLUMN "value2";',
    result: {
      isRead: false,
      query: 'ALTER TABLE "variables" DROP COLUMN "value2";',
      params: [],
      tables: ["variables"],
      columns: ["value2"],
      keys: [],
      type: ParseType.modify_table_columns,
    },
    isSkip: true
  },
  /* #endregion */

  /* #region  Data. */
  {
    id: 21,
    name: 'Data - insert',
    query: 'INSERT INTO variables (id, value) VALUES ("isWAL", 1);',
    result: {
      isRead: false,
      query: 'INSERT INTO variables (id, value) VALUES ("isWAL", 1);',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data,
    }
  }, {
    id: 22,
    name: 'Data - insert with select.',
    query: 'INSERT INTO variables SELECT * FROM variables2;',
    result: {
      isRead: true,
      query: 'INSERT INTO variables SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 23,
    name: 'Data - upsert',
    query: 'INSERT OR REPLACE INTO variables (id, value) VALUES ("isWAL", 1);',
    result: {
      isRead: false,
      query: 'INSERT OR REPLACE INTO variables (id, value) VALUES ("isWAL", 1);',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 24,
    name: 'Data - UPSERT with select.',
    query: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
    result: {
      isRead: true,
      query: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    },
    isSkip: false
  }, {
    id: 25,
    name: 'Data - update',
    query: 'UPDATE variables SET value = "new";',
    result: {
      isRead: false,
      query: 'UPDATE variables SET value = "new";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 26,
    name: 'Data - update with select',
    query: 'UPDATE variables SET value = "new" WHERE id IN (SELECT id FROM variables);',
    result: {
      isRead: true,
      query: 'UPDATE variables SET value = "new" WHERE id IN (SELECT id FROM variables);',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 27,
    name: 'Data - delete',
    query: 'DELETE FROM variables WHERE value = "new";',
    result: {
      isRead: false,
      query: 'DELETE FROM variables WHERE value = "new";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 28,
    name: 'Data - select',
    query: 'SELECT * FROM variables WHERE value = "new";',
    result: {
      isRead: false,
      query: 'SELECT * FROM variables WHERE value = "new";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.select_data
    }
  }, {
    id: 29,
    name: 'Data - select with join',
    query: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
    result: {
      isRead: false,
      query: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
      params: [],
      tables: ["variables", "variables2"],
      columns: [],
      keys: [],
      type: ParseType.select_data
    }
  },
  /* #endregion */

  /* #region  Other. */
  {
    id: 30,
    name: 'Other - add pragma',
    query: 'PRAGMA pragma_name = value;',
    result: {
      isRead: false,
      query: 'PRAGMA pragma_name = value;',
      params: [],
      tables: [],
      columns: [],
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

      expect(result).to.be.deep.equal(test.result);
    });
  }
});