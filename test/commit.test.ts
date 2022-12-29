import { expect } from 'chai';

import { Commit } from '../src/objects/commit';
import { ParseType, Query } from '../src/objects/statement';

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
          query: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          tables: ["user"],
          columns: [],
          keys: [],
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
          query: 'BEGIN;',
          params: [],

          isRead: false,
          tables: [],
          columns: [],
          keys: [],
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
          query: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          tables: ["user"],
          columns: [],
          keys: [],
          type: ParseType.select_data
        }, {
          query: 'INSERT INTO user VALUES (?, ?, ?, ?);',
          params: [1, "Timber", "Saw", 25],

          isRead: false,
          tables: ["user"],
          columns: [],
          keys: [],
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
          query: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          tables: ["user"],
          columns: [],
          keys: [],
          type: ParseType.select_data
        }, {
          query: 'BEGIN;',
          params: [],

          isRead: false,
          tables: [],
          columns: [],
          keys: [],
          type: ParseType.begin_transaction
        }, {
          query: 'INSERT INTO user VALUES (?, ?, ?, ?);',
          params: [1, "Timber", "Saw", 25],

          isRead: false,
          tables: ["user"],
          columns: [],
          keys: [],
          type: ParseType.modify_data
        }, {
          query: 'ROLLBACK TRANSACTION;',
          params: [],

          isRead: false,
          tables: [],
          columns: [],
          keys: [],
          type: ParseType.rollback_transaction
        }, {
          query: 'END;',
          params: [],

          isRead: false,
          tables: [],
          columns: [],
          keys: [],
          type: ParseType.commit_transaction
        }, {
          query: 'SELECT * FROM user;',
          params: [],

          isRead: false,
          tables: ["user"],
          columns: [],
          keys: [],
          type: ParseType.select_data
        }
      ]
    },
  },
];

describe('Commits - Load.', function () {
  for (const test of loadTests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const commit = new Commit({
        script: test.script,
        params: test.params
      });

      // Copy and cleanup the statement.
      const result = commit.toObject();

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
        query: '\n SELECT * FROM user;',
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
        query: 'BEGIN;',
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
        query: 'SELECT * FROM user;',
        params: []
      }, {
        query: 'INSERT INTO user VALUES (?, ?, ?, ?);',
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
        query: 'SELECT * FROM user;',
        params: []
      }, {
        query: 'BEGIN;',
        params: []
      }, {
        query: 'INSERT INTO user VALUES (?, ?, ?, ?);',
        params: [1, "Timber", "Saw", 25],
      }, {
        query: 'ROLLBACK TRANSACTION;',
        params: []
      }, {
        query: 'END;',
        params: []
      }, {
        query: 'SELECT * FROM user;',
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

describe('Commits - Save.', function () {
  for (const test of saveTests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const statements = test.statements.map((statement) => 
        new Query(statement)
      );
      const commit = new Commit({ statements });

      expect(commit.toString()).to.be.deep.equal(test.result);
      expect(commit.params).to.be.deep.equal(test.params);
    });
  }
});