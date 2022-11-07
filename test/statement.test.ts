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
      index: 0,
      statement: 'BEGIN;',
      type: ParseType.begin_transaction
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Transaction - begin trim',
    statement: '\n  BEGIN;',
    result: {
      index: 0,
      statement: 'BEGIN;',
      type: ParseType.begin_transaction
    }
  }, {
    id: 2,
    name: 'Transaction - begin long',
    statement: 'BEGIN TRANSACTION;',
    result: {
      index: 0,
      statement: 'BEGIN TRANSACTION;',
      type: ParseType.begin_transaction
    }
  }, {
    id: 3,
    name: 'Transaction - rollback',
    statement: 'ROLLBACK;',
    result: {
      index: 0,
      statement: 'ROLLBACK;',
      type: ParseType.rollback_transaction
    }
  }, {
    id: 4,
    name: 'Transaction - rollback long',
    statement: 'ROLLBACK TRANSACTION;',
    result: {
      index: 0,
      statement: 'ROLLBACK TRANSACTION;',
      type: ParseType.rollback_transaction
    }
  }, {
    id: 5,
    name: 'Transaction - commit',
    statement: 'COMMIT;',
    result: {
      index: 0,
      statement: 'COMMIT;',
      type: ParseType.commit_transaction
    }
  }, {
    id: 6,
    name: 'Transaction - commit long',
    statement: 'COMMIT TRANSACTION;',
    result: {
      index: 0,
      statement: 'COMMIT TRANSACTION;',
      type: ParseType.commit_transaction
    }
  }, {
    id: 7,
    name: 'Transaction - end',
    statement: 'END;',
    result: {
      index: 0,
      statement: 'END;',
      type: ParseType.commit_transaction
    }
  }, {
    id: 8,
    name: 'Transaction - end long',
    statement: 'END TRANSACTION;',
    result: {
      index: 0,
      statement: 'END TRANSACTION;',
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
      index: 0,
      statement: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      type: ParseType.create_table,
      tables: ["variables"]
    }
  }, {
    id: 10,
    name: 'Table - create temp',
    statement: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
    result: {
      index: 0,
      statement: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      type: ParseType.create_table,
      tables: ["variables"]
    }
  }, {
    id: 11,
    name: 'Table - drop',
    statement: 'DROP TABLE "variables";',
    result: {
      index: 0,
      statement: 'DROP TABLE "variables";',
      type: ParseType.drop_table,
      tables: ["variables"]
    }
  }, {
    id: 12,
    name: 'Table - drop conditional',
    statement: 'DROP TABLE IF EXISTS "variables";',
    result: {
      index: 0,
      statement: 'DROP TABLE IF EXISTS "variables";',
      type: ParseType.drop_table,
      tables: ["variables"]
    }
  },

  // https://www.sqlite.org/lang_altertable.html
  {
    id: 13,
    name: 'Table - rename',
    statement: 'ALTER TABLE "variables" RENAME TO "variables2";',
    result: {
      index: 0,
      statement: 'ALTER TABLE "variables" RENAME TO "variables2";',
      type: ParseType.rename_table,
      tables: ["variables2", "variables"]
    }
  }, {
    id: 14,
    name: 'Table - TODO: rename column',
    statement: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
    result: {
      index: 0,
      statement: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
      type: ParseType.rename_table,
      tables: ["variables2", "variables"]
    },
    isSkip: true
  }, {
    id: 15,
    name: 'Table - add column',
    statement: 'ALTER TABLE "variables" ADD "value2";',
    result: {
      index: 0,
      statement: 'ALTER TABLE "variables" ADD "value2";',
      type: ParseType.modify_table_columns,
      tables: ["variables"]
    }
  }, {
    id: 16,
    name: 'Table - add column long',
    statement: 'ALTER TABLE "variables" ADD COLUMN "value2";',
    result: {
      index: 0,
      statement: 'ALTER TABLE "variables" ADD COLUMN "value2";',
      type: ParseType.modify_table_columns,
      tables: ["variables"]
    }
  }, {
    id: 17,
    name: 'Table - TODO: drop column',
    statement: 'ALTER TABLE "variables" DROP "value2";',
    result: {
      index: 0,
      statement: 'ALTER TABLE "variables" DROP "value2";',
      type: ParseType.modify_table_columns,
      tables: ["variables"]
    },
    isSkip: true
  }, {
    id: 18,
    name: 'Table - TODO: drop column long',
    statement: 'ALTER TABLE "variables" DROP COLUMN "value2";',
    result: {
      index: 0,
      statement: 'ALTER TABLE "variables" DROP COLUMN "value2";',
      type: ParseType.modify_table_columns,
      tables: ["variables"]
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
      index: 0,
      statement: 'INSERT INTO variables VALUES ("isWAL", 1);',
      type: ParseType.modify_data,
      tables: ["variables"]
    }
  }, {
    id: 20,
    name: 'Data - upsert',
    statement: 'INSERT OR REPLACE INTO variables VALUES ("isWAL", 1);',
    result: {
      index: 0,
      statement: 'INSERT OR REPLACE INTO variables VALUES ("isWAL", 1);',
      type: ParseType.modify_data,
      tables: ["variables"]
    }
  }, {
    id: 21,
    name: 'Data - update',
    statement: 'UPDATE variables SET value = "new";',
    result: {
      index: 0,
      statement: 'UPDATE variables SET value = "new";',
      type: ParseType.modify_data,
      tables: ["variables"]
    }
  }, {
    id: 22,
    name: 'Data - delete',
    statement: 'DELETE FROM variables WHERE value = "new";',
    result: {
      index: 0,
      statement: 'DELETE FROM variables WHERE value = "new";',
      type: ParseType.modify_data,
      tables: ["variables"]
    }
  }, {
    id: 23,
    name: 'Data - select',
    statement: 'SELECT * FROM variables WHERE value = "new";',
    result: {
      index: 0,
      statement: 'SELECT * FROM variables WHERE value = "new";',
      type: ParseType.select_data,
      tables: ["variables"]
    }
  }, {
    id: 24,
    name: 'Data - select with join',
    statement: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
    result: {
      index: 0,
      statement: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
      type: ParseType.select_data,
      tables: ["variables", "variables2"]
    }
  },
  /* #endregion */

  /* #region  Other. */
  {
    id: 25,
    name: 'Other - add pragma',
    statement: 'PRAGMA pragma_name = value;',
    result: {
      index: 0,
      statement: 'PRAGMA pragma_name = value;',
      type: ParseType.other
    }
  },
  /* #endregion */
];

describe('Statements.', function () {
  for (const test of tests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const statement = new Statement({ index: 0, statement: test.statement });
      statement.validator.ready();

      // Copy and cleanup the statement.
      const result = Object.assign(
        {},
        statement
      );
      delete result.validator;
      delete result.meta;

      expect(result).to.be.deep.equal(test.result);
    });
  }
});