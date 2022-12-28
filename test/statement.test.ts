import { expect } from 'chai';
import { ParseType, Statement } from '../src/objects/statement';

const tests = [
  /* #region  Transactions. */
  // https://www.sqlite.org/lang_transaction.html
  {
    id: 0,
    name: 'Transaction - begin',
    statement: 'BEGIN;',
    result: {
      isRead: false,
      statement: 'BEGIN;',
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
    statement: '\n  BEGIN;',
    result: {
      isRead: false,
      statement: 'BEGIN;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 2,
    name: 'Transaction - begin long',
    statement: 'BEGIN TRANSACTION;',
    result: {
      isRead: false,
      statement: 'BEGIN TRANSACTION;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 3,
    name: 'Transaction - rollback',
    statement: 'ROLLBACK;',
    result: {
      isRead: false,
      statement: 'ROLLBACK;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 4,
    name: 'Transaction - rollback long',
    statement: 'ROLLBACK TRANSACTION;',
    result: {
      isRead: false,
      statement: 'ROLLBACK TRANSACTION;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 5,
    name: 'Transaction - commit',
    statement: 'COMMIT;',
    result: {
      isRead: false,
      statement: 'COMMIT;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 6,
    name: 'Transaction - commit long',
    statement: 'COMMIT TRANSACTION;',
    result: {
      isRead: false,
      statement: 'COMMIT TRANSACTION;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 7,
    name: 'Transaction - end',
    statement: 'END;',
    result: {
      isRead: false,
      statement: 'END;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 8,
    name: 'Transaction - end long',
    statement: 'END TRANSACTION;',
    result: {
      isRead: false,
      statement: 'END TRANSACTION;',
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
    statement: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
    result: {
      isRead: false,
      statement: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      params: [],
      tables: ["variables"],
      columns: ["id", "value"],
      keys: ["id"],
      type: ParseType.create_table,
    }
  }, {
    id: 10,
    name: 'Table - create temp',
    statement: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
    result: {
      isRead: false,
      statement: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      params: [],
      tables: ["variables"],
      columns: ["id", "value"],
      keys: ["id"],
      type: ParseType.create_table,
    }
  }, {
    id: 11,
    name: 'Data - create table with select.',
    statement: 'CREATE TABLE variables AS SELECT * FROM variables2;',
    result: {
      isRead: true,
      statement: 'CREATE TABLE variables AS SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      columns: [],
      keys: [],
      type: ParseType.create_table,
    },
    isSkip: false
  }, {
    id: 12,
    name: 'Table - drop',
    statement: 'DROP TABLE "variables";',
    result: {
      isRead: false,
      statement: 'DROP TABLE "variables";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.drop_table,
    }
  }, {
    id: 13,
    name: 'Table - drop conditional',
    statement: 'DROP TABLE IF EXISTS "variables";',
    result: {
      isRead: false,
      statement: 'DROP TABLE IF EXISTS "variables";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.drop_table,
    }
  },

  // https://www.sqlite.org/lang_altertable.html
  {
    id: 14,
    name: 'Table - rename',
    statement: 'ALTER TABLE "variables" RENAME TO "variables2";',
    result: {
      isRead: false,
      statement: 'ALTER TABLE "variables" RENAME TO "variables2";',
      params: [],
      tables: ["variables2", "variables"],
      columns: [],
      keys: [],
      type: ParseType.rename_table
    }
  }, {
    id: 15,
    name: 'Table - TODO: rename column',
    statement: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
    result: {
      isRead: false,
      statement: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
      params: [],
      tables: ["variables2", "variables"],
      columns: ["value", "value2"],
      keys: [],
      type: ParseType.rename_table,
    },
    isSkip: true
  }, {
    id: 16,
    name: 'Table - add column',
    statement: 'ALTER TABLE "variables" ADD "value2";',
    result: {
      isRead: false,
      statement: 'ALTER TABLE "variables" ADD "value2";',
      params: [],
      tables: ["variables"],
      columns: ["value2"],
      keys: [],
      type: ParseType.modify_table_columns
    }
  }, {
    id: 17,
    name: 'Table - add column long',
    statement:
      'ALTER TABLE "variables" ADD COLUMN "value2" VARCHAR PRIMARY KEY;',
    result: {
      isRead: false,
      statement:
        'ALTER TABLE "variables" ADD COLUMN "value2" VARCHAR PRIMARY KEY;',
      params: [],
      tables: ["variables"],
      columns: ["value2"],
      keys: ["value2"],
      type: ParseType.modify_table_columns,
    }
  }, {
    id: 18,
    name: 'Table - TODO: drop column',
    statement: 'ALTER TABLE "variables" DROP "value2";',
    result: {
      isRead: false,
      statement: 'ALTER TABLE "variables" DROP "value2";',
      params: [],
      tables: ["variables"],
      columns: ["value2"],
      keys: [],
      type: ParseType.modify_table_columns,
    },
    isSkip: true
  }, {
    id: 19,
    name: 'Table - TODO: drop column long',
    statement: 'ALTER TABLE "variables" DROP COLUMN "value2";',
    result: {
      isRead: false,
      statement: 'ALTER TABLE "variables" DROP COLUMN "value2";',
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
    id: 19,
    name: 'Data - insert',
    statement: 'INSERT INTO variables VALUES ("isWAL", 1);',
    result: {
      isRead: false,
      statement: 'INSERT INTO variables VALUES ("isWAL", 1);',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data,
    }
  }, {
    id: 20,
    name: 'Data - insert with select.',
    statement: 'INSERT INTO variables SELECT * FROM variables2;',
    result: {
      isRead: true,
      statement: 'INSERT INTO variables SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 21,
    name: 'Data - upsert',
    statement: 'INSERT OR REPLACE INTO variables VALUES ("isWAL", 1);',
    result: {
      isRead: false,
      statement: 'INSERT OR REPLACE INTO variables VALUES ("isWAL", 1);',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 22,
    name: 'Data - UPSERT with select.',
    statement: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
    result: {
      isRead: true,
      statement: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    },
    isSkip: false
  }, {
    id: 23,
    name: 'Data - update',
    statement: 'UPDATE variables SET value = "new";',
    result: {
      isRead: false,
      statement: 'UPDATE variables SET value = "new";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 24,
    name: 'Data - update with select',
    statement: 'UPDATE variables SET value = "new" WHERE id IN (SELECT id FROM variables);',
    result: {
      isRead: true,
      statement: 'UPDATE variables SET value = "new" WHERE id IN (SELECT id FROM variables);',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 25,
    name: 'Data - delete',
    statement: 'DELETE FROM variables WHERE value = "new";',
    result: {
      isRead: false,
      statement: 'DELETE FROM variables WHERE value = "new";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.modify_data
    }
  }, {
    id: 26,
    name: 'Data - select',
    statement: 'SELECT * FROM variables WHERE value = "new";',
    result: {
      isRead: false,
      statement: 'SELECT * FROM variables WHERE value = "new";',
      params: [],
      tables: ["variables"],
      columns: [],
      keys: [],
      type: ParseType.select_data
    }
  }, {
    id: 27,
    name: 'Data - select with join',
    statement: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
    result: {
      isRead: false,
      statement: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
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
    id: 28,
    name: 'Other - add pragma',
    statement: 'PRAGMA pragma_name = value;',
    result: {
      isRead: false,
      statement: 'PRAGMA pragma_name = value;',
      params: [],
      tables: [],
      columns: [],
      keys: [],
      type: ParseType.other
    }
  },
  /* #endregion */
];

describe('Statements.', function () {
  for (const test of tests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const statement = new Statement({
        statement: test.statement,
        params: []
      });
      statement.validator.ready();

      // Copy and cleanup the statement.
      const result = statement.toObject();

      expect(result).to.be.deep.equal(test.result);
    });
  }
});