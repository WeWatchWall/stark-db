import { expect } from 'chai';
import copy from 'fast-copy';

import { Script } from '../src/objects/script';
import { ParseType, Statement } from '../src/objects/statement';

const loadTests = [
  {
    id: 0,
    name: 'Empty',
    script: '',
    params: [],
    result: {
      script: '',
      params: [],
      statements: []
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Single statement',
    script: '\n  SELECT * FROM user;',
    params: [],
    result: {
      script: 'SELECT * FROM user;',
      params: [],
      statements: [
        {
          index: 0,
          statement: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          isTransaction: false,
          tables: ["user"],
          type: ParseType.select_data
        }
      ]
    },
  }, {
    id: 2,
    name: 'Single statement - transaction',
    script: '\n  BEGIN;',
    params: [],
    result: {
      script: 'BEGIN;',
      params: [],
      statements: [
        {
          index: 0,
          statement: 'BEGIN;',
          params: [],

          isRead: false,
          isTransaction: true,
          tables: [],
          type: ParseType.begin_transaction
        }
      ]
    },
  }, {
    id: 3,
    name: 'Multiple statements',
    script: 'SELECT * FROM user; INSERT INTO user VALUES (?, ?, ?, ?);',
    params: [1, "Timber", "Saw", 25],
    result: {
      script: 'SELECT * FROM user; INSERT INTO user VALUES (?, ?, ?, ?);',
      params: [1, "Timber", "Saw", 25],
      statements: [
        {
          index: 0,
          statement: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          isTransaction: false,
          tables: ["user"],
          type: ParseType.select_data
        }, {
          index: 1,
          statement: 'INSERT INTO user VALUES (?, ?, ?, ?);',
          params: [1, "Timber", "Saw", 25],

          isRead: false,
          isTransaction: false,
          tables: ["user"],
          type: ParseType.modify_data
        }
      ]
    },
  }, {
    id: 4,
    name: 'Multiple statements',
    script: 'SELECT * FROM user; BEGIN; INSERT INTO user VALUES (?, ?, ?, ?); ROLLBACK TRANSACTION; END; SELECT * FROM user;',
    params: [1, "Timber", "Saw", 25],
    result: {
      script: 'SELECT * FROM user; BEGIN; INSERT INTO user VALUES (?, ?, ?, ?); ROLLBACK TRANSACTION; END; SELECT * FROM user;',
      params: [1, "Timber", "Saw", 25],
      statements: [
        {
          index: 0,
          statement: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          isTransaction: false,
          tables: ["user"],
          type: ParseType.select_data
        }, {
          index: 1,
          statement: 'BEGIN;',
          params: [],

          isRead: false,
          isTransaction: true,
          tables: [],
          type: ParseType.begin_transaction
        }, {
          index: 2,
          statement: 'INSERT INTO user VALUES (?, ?, ?, ?);',
          params: [1, "Timber", "Saw", 25],

          isRead: false,
          isTransaction: true,
          tables: ["user"],
          type: ParseType.modify_data
        }, {
          index: 3,
          statement: 'ROLLBACK TRANSACTION;',
          params: [],

          isRead: false,
          isTransaction: true,
          tables: [],
          type: ParseType.rollback_transaction
        }, {
          index: 4,
          statement: 'END;',
          params: [],

          isRead: false,
          isTransaction: true,
          tables: [],
          type: ParseType.commit_transaction
        }, {
          index: 5,
          statement: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          isTransaction: false,
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
      const script = new Script({
        script: test.script,
        params: test.params
      });

      // Copy and cleanup the statement.
      const result = copy(script);

      delete result.loader;
      delete result.validator;
      delete (<any>result).isSave; // isSave is private.

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
    params: [],
    isSkip: false
  }, {
    id: 1,
    name: 'Single statement',
    statements: [
      {
        index: 0,
        statement: '\n SELECT * FROM user;',
        params: []
      }
    ],
    result: 'SELECT * FROM user;',
    params: []
  }, {
    id: 2,
    name: 'Single statement - transaction',
    statements: [
      {
        index: 0,
        statement: 'BEGIN;',
        params: []
      }
    ],
    result: 'BEGIN;',
    params: []
  }, {
    id: 3,
    name: 'Multiple statements',
    statements: [
      {
        index: 0,
        statement: 'SELECT * FROM user;',
        params: []
      }, {
        index: 1,
        statement: 'INSERT INTO user VALUES (?, ?, ?, ?);',
        params: [1, "Timber", "Saw", 25],
      }
    ],
    result: `SELECT * FROM user;
INSERT INTO user VALUES (?, ?, ?, ?);`,
    params: [1, "Timber", "Saw", 25],
  }, {
    id: 4,
    name: 'Multiple statements',
    statements: [
      {
        index: 0,
        statement: 'SELECT * FROM user;',
        params: []
      }, {
        index: 1,
        statement: 'BEGIN;',
        params: []
      }, {
        index: 2,
        statement: 'INSERT INTO user VALUES (?, ?, ?, ?);',
        params: [1, "Timber", "Saw", 25],
      }, {
        index: 3,
        statement: 'ROLLBACK TRANSACTION;',
        params: []
      }, {
        index: 4,
        statement: 'END;',
        params: []
      }, {
        index: 5,
        statement: 'SELECT * FROM user;',
        params: []
      }
    ],
    result: `SELECT * FROM user;
BEGIN;
INSERT INTO user VALUES (?, ?, ?, ?);
ROLLBACK TRANSACTION;
END;
SELECT * FROM user;`,
  params: [1, "Timber", "Saw", 25],
  }
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
      expect(script.params).to.be.deep.equal(test.params);
    });
  }
});