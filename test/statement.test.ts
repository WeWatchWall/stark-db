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
      isRead: false,
      statement: 'BEGIN;',
      params: [],
      tables: [],
      type: ParseType.begin_transaction
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Transaction - begin trim',
    statement: '\n  BEGIN;',
    result: {
      index: 0,
      isRead: false,
      statement: 'BEGIN;',
      params: [],
      tables: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 2,
    name: 'Transaction - begin long',
    statement: 'BEGIN TRANSACTION;',
    result: {
      index: 0,
      isRead: false,
      statement: 'BEGIN TRANSACTION;',
      params: [],
      tables: [],
      type: ParseType.begin_transaction
    }
  }, {
    id: 3,
    name: 'Transaction - rollback',
    statement: 'ROLLBACK;',
    result: {
      index: 0,
      isRead: false,
      statement: 'ROLLBACK;',
      params: [],
      tables: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 4,
    name: 'Transaction - rollback long',
    statement: 'ROLLBACK TRANSACTION;',
    result: {
      index: 0,
      isRead: false,
      statement: 'ROLLBACK TRANSACTION;',
      params: [],
      tables: [],
      type: ParseType.rollback_transaction
    }
  }, {
    id: 5,
    name: 'Transaction - commit',
    statement: 'COMMIT;',
    result: {
      index: 0,
      isRead: false,
      statement: 'COMMIT;',
      params: [],
      tables: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 6,
    name: 'Transaction - commit long',
    statement: 'COMMIT TRANSACTION;',
    result: {
      index: 0,
      isRead: false,
      statement: 'COMMIT TRANSACTION;',
      params: [],
      tables: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 7,
    name: 'Transaction - end',
    statement: 'END;',
    result: {
      index: 0,
      isRead: false,
      statement: 'END;',
      params: [],
      tables: [],
      type: ParseType.commit_transaction
    }
  }, {
    id: 8,
    name: 'Transaction - end long',
    statement: 'END TRANSACTION;',
    result: {
      index: 0,
      isRead: false,
      statement: 'END TRANSACTION;',
      params: [],
      tables: [],
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
      isRead: false,
      statement: 'CREATE TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      params: [],
      tables: ["variables"],
      type: ParseType.create_table,
    }
  }, {
    id: 10,
    name: 'Table - create temp',
    statement: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
    result: {
      index: 0,
      isRead: false,
      statement: 'CREATE TEMPORARY TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);',
      params: [],
      tables: ["variables"],
      type: ParseType.create_table,
    }
  }, {
    id: 11,
    name: 'Data - create table with select.',
    statement: 'CREATE TABLE variables AS SELECT * FROM variables2;',
    result: {
      index: 0,
      isRead: true,
      statement: 'CREATE TABLE variables AS SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      type: ParseType.create_table,
    },
    isSkip: false
  }, {
    id: 12,
    name: 'Table - drop',
    statement: 'DROP TABLE "variables";',
    result: {
      index: 0,
      isRead: false,
      statement: 'DROP TABLE "variables";',
      params: [],
      tables: ["variables"],
      type: ParseType.drop_table,
    }
  }, {
    id: 13,
    name: 'Table - drop conditional',
    statement: 'DROP TABLE IF EXISTS "variables";',
    result: {
      index: 0,
      isRead: false,
      statement: 'DROP TABLE IF EXISTS "variables";',
      params: [],
      tables: ["variables"],
      type: ParseType.drop_table,
    }
  },

  // https://www.sqlite.org/lang_altertable.html
  {
    id: 14,
    name: 'Table - rename',
    statement: 'ALTER TABLE "variables" RENAME TO "variables2";',
    result: {
      index: 0,
      isRead: false,
      statement: 'ALTER TABLE "variables" RENAME TO "variables2";',
      params: [],
      tables: ["variables2", "variables"],
      type: ParseType.rename_table
    }
  }, {
    id: 15,
    name: 'Table - TODO: rename column',
    statement: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
    result: {
      index: 0,
      isRead: false,
      statement: 'ALTER TABLE "variables" RENAME COLUMN "value" TO "value2";',
      params: [],
      tables: ["variables2", "variables"],
      type: ParseType.rename_table,
    },
    isSkip: true
  }, {
    id: 16,
    name: 'Table - add column',
    statement: 'ALTER TABLE "variables" ADD "value2";',
    result: {
      index: 0,
      isRead: false,
      statement: 'ALTER TABLE "variables" ADD "value2";',
      params: [],
      tables: ["variables"],
      type: ParseType.modify_table_columns
    }
  }, {
    id: 17,
    name: 'Table - add column long',
    statement: 'ALTER TABLE "variables" ADD COLUMN "value2";',
    result: {
      index: 0,
      isRead: false,
      statement: 'ALTER TABLE "variables" ADD COLUMN "value2";',
      params: [],
      tables: ["variables"],
      type: ParseType.modify_table_columns,
    }
  }, {
    id: 18,
    name: 'Table - TODO: drop column',
    statement: 'ALTER TABLE "variables" DROP "value2";',
    result: {
      index: 0,
      isRead: false,
      statement: 'ALTER TABLE "variables" DROP "value2";',
      params: [],
      tables: ["variables"],
      type: ParseType.modify_table_columns,
    },
    isSkip: true
  }, {
    id: 19,
    name: 'Table - TODO: drop column long',
    statement: 'ALTER TABLE "variables" DROP COLUMN "value2";',
    result: {
      index: 0,
      isRead: false,
      statement: 'ALTER TABLE "variables" DROP COLUMN "value2";',
      params: [],
      tables: ["variables"],
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
      index: 0,
      isRead: false,
      statement: 'INSERT INTO variables VALUES ("isWAL", 1);',
      params: [],
      tables: ["variables"],
      type: ParseType.modify_data,
    }
  }, {
    id: 20,
    name: 'Data - insert with select.',
    statement: 'INSERT INTO variables SELECT * FROM variables2;',
    result: {
      index: 0,
      isRead: true,
      statement: 'INSERT INTO variables SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      type: ParseType.modify_data
    }
  }, {
    id: 21,
    name: 'Data - upsert',
    statement: 'INSERT OR REPLACE INTO variables VALUES ("isWAL", 1);',
    result: {
      index: 0,
      isRead: false,
      statement: 'INSERT OR REPLACE INTO variables VALUES ("isWAL", 1);',
      params: [],
      tables: ["variables"],
      type: ParseType.modify_data
    }
  }, {
    id: 22,
    name: 'Data - UPSERT with select.',
    statement: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
    result: {
      index: 0,
      isRead: true,
      statement: 'INSERT OR REPLACE INTO variables SELECT * FROM variables2;',
      params: [],
      tables: ["variables", "variables2"],
      type: ParseType.modify_data
    },
    isSkip: false
  }, {
    id: 23,
    name: 'Data - update',
    statement: 'UPDATE variables SET value = "new";',
    result: {
      index: 0,
      isRead: false,
      statement: 'UPDATE variables SET value = "new";',
      params: [],
      type: ParseType.modify_data,
      tables: ["variables"]
    }
  }, {
    id: 24,
    name: 'Data - delete',
    statement: 'DELETE FROM variables WHERE value = "new";',
    result: {
      index: 0,
      isRead: false,
      statement: 'DELETE FROM variables WHERE value = "new";',
      params: [],
      type: ParseType.modify_data,
      tables: ["variables"]
    }
  }, {
    id: 25,
    name: 'Data - select',
    statement: 'SELECT * FROM variables WHERE value = "new";',
    result: {
      index: 0,
      isRead: false,
      statement: 'SELECT * FROM variables WHERE value = "new";',
      params: [],
      type: ParseType.select_data,
      tables: ["variables"]
    }
  }, {
    id: 26,
    name: 'Data - select with join',
    statement: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
    result: {
      index: 0,
      isRead: false,
      statement: 'SELECT * FROM variables A, variables2 B WHERE A.id = B.id;',
      params: [],
      tables: ["variables", "variables2"],
      type: ParseType.select_data
    }
  },
  /* #endregion */

  /* #region  Other. */
  {
    id: 27,
    name: 'Other - add pragma',
    statement: 'PRAGMA pragma_name = value;',
    result: {
      index: 0,
      statement: 'PRAGMA pragma_name = value;',
      params: [],
      tables: [],
      isRead: false,
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
        index: 0,
        statement: test.statement,
        params: []
      });
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