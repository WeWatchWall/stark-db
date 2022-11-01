import { expect } from 'chai';
import copy from 'fast-copy';

import { Script } from '../src/shared/script';
import { ParseType, Statement } from '../src/shared/statement';

const loadTests = [
  {
    id: 0,
    name: 'Empty',
    script: '',
    result: {
      script: '',
      statements: []
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Single statement',
    script: '\n  SELECT * FROM user;',
    result: {
      script: 'SELECT * FROM user;',
      statements: [
        {
          index: 0,
          isTransaction: false,
          statement: 'SELECT * FROM user;',
          tables: ["user"],
          type: ParseType.select_data
        }
      ]
    },
  }, {
    id: 2,
    name: 'Single statement - transaction',
    script: '\n  BEGIN;',
    result: {
      script: 'BEGIN;',
      statements: [
        {
          index: 0,
          isTransaction: true,
          statement: 'BEGIN;',
          type: ParseType.begin_transaction
        }
      ]
    },
  }, {
    id: 3,
    name: 'Multiple statements',
    script: 'SELECT * FROM user; INSERT INTO user VALUES (1, "Timber", "Saw", 25);',
    result: {
      script: 'SELECT * FROM user; INSERT INTO user VALUES (1, "Timber", "Saw", 25);',
      statements: [
        {
          index: 0,
          isTransaction: false,
          statement: 'SELECT * FROM user;',
          tables: ["user"],
          type: ParseType.select_data
        }, {
          index: 1,
          isTransaction: false,
          statement: 'INSERT INTO user VALUES (1, "Timber", "Saw", 25);',
          tables: ["user"],
          type: ParseType.modify_data
        }
      ]
    },
  }, {
    id: 4,
    name: 'Multiple statements',
    script: 'SELECT * FROM user; BEGIN; INSERT INTO user VALUES (1, "Timber", "Saw", 25); ROLLBACK TRANSACTION; END; SELECT * FROM user;',
    result: {
      script: 'SELECT * FROM user; BEGIN; INSERT INTO user VALUES (1, "Timber", "Saw", 25); ROLLBACK TRANSACTION; END; SELECT * FROM user;',
      statements: [
        {
          index: 0,
          isTransaction: false,
          statement: 'SELECT * FROM user;',
          tables: ["user"],
          type: ParseType.select_data
        }, {
          index: 1,
          isTransaction: true,
          statement: 'BEGIN;',
          type: ParseType.begin_transaction
        }, {
          index: 2,
          isTransaction: true,
          statement: 'INSERT INTO user VALUES (1, "Timber", "Saw", 25);',
          tables: ["user"],
          type: ParseType.modify_data
        }, {
          index: 3,
          isTransaction: true,
          statement: 'ROLLBACK TRANSACTION;',
          type: ParseType.rollback_transaction
        }, {
          index: 4,
          isTransaction: true,
          statement: 'END;',
          type: ParseType.commit_transaction
        }, {
          index: 5,
          isTransaction: false,
          statement: 'SELECT * FROM user;',
          tables: ["user"],
          type: ParseType.select_data
        }
      ]
    },
  },
];

describe('Scripts - Load.', function () {
  for (const test of loadTests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const script = new Script({ script: test.script });

      // Copy and cleanup the statement.
      const result = copy(script);
      delete result.loader;
      delete result.validator;
      for (const statement of result.statements) {
        delete statement.validator;
        delete statement.meta;
      }

      expect(result).to.be.deep.equal(test.result);
    });
  }
});

const saveTests = [
  {
    id: 0,
    name: 'Empty',
    statements: [],
    result: '',
    isSkip: false
  }, {
    id: 1,
    name: 'Single statement',
    statements: [
      {
        index: 0,
        statement: '\n SELECT * FROM user;',
      }
    ],
    result: 'SELECT * FROM user;',
  }, {
    id: 2,
    name: 'Single statement - transaction',
    statements: [
      {
        index: 0,
        statement: 'BEGIN;',
      }
    ],
    result: 'BEGIN;',
  }, {
    id: 3,
    name: 'Multiple statements',
    statements: [
      {
        index: 0,
        statement: 'SELECT * FROM user;',
      }, {
        index: 1,
        statement: 'INSERT INTO user VALUES (1, "Timber", "Saw", 25);',
      }
    ],
    result: `SELECT * FROM user;
INSERT INTO user VALUES (1, "Timber", "Saw", 25);`,
  }, {
    id: 4,
    name: 'Multiple statements',
    statements: [
      {
        index: 0,
        statement: 'SELECT * FROM user;',
      }, {
        index: 1,
        statement: 'BEGIN;',
      }, {
        index: 2,
        statement: 'INSERT INTO user VALUES (1, "Timber", "Saw", 25);',
      }, {
        index: 3,
        statement: 'ROLLBACK TRANSACTION;',
      }, {
        index: 4,
        statement: 'END;',
      }, {
        index: 5,
        statement: 'SELECT * FROM user;',
      }
    ],
    result: `SELECT * FROM user;
BEGIN;
INSERT INTO user VALUES (1, "Timber", "Saw", 25);
ROLLBACK TRANSACTION;
END;
SELECT * FROM user;`,
  },
];

describe('Scripts - Save.', function () {
  for (const test of saveTests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const statements = test.statements.map((statement) => 
        new Statement(statement)
      );
      const script = new Script({ statements });

      expect(script.toString()).to.be.deep.equal(test.result);
    });
  }
});