import { expect } from 'chai';

import { CommitArg } from '../src/objects/commit';
import { CommitList } from '../src/objects/commitList';
import { ParseType } from '../src/objects/statement';

const loadTests = [
  {
    id: 0,
    name: 'Empty',
    script: '',
    params: [],
    result: {
      script: '',
      params: [],
      commits: [],
      isLong: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Missing start transaction',
    script: `SELECT * FROM user;
COMMIT TRANSACTION;`,
    params: [],
    result: {
      script: "BEGIN TRANSACTION;\nSELECT * FROM user;\nCOMMIT TRANSACTION;",
      params: [],
      commits: [
        {
          script:
            "BEGIN TRANSACTION;\nSELECT * FROM user;\nCOMMIT TRANSACTION;",
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              statement: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              statement: "COMMIT TRANSACTION;",
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 2,
    name: 'Missing start transaction - Multiple',
    script: `SELECT * FROM user;
COMMIT TRANSACTION;
BEGIN TRANSACTION;
SELECT * FROM user;
COMMIT TRANSACTION;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
SELECT * FROM user;
COMMIT TRANSACTION;
BEGIN TRANSACTION;
SELECT * FROM user;
COMMIT TRANSACTION;`,
      params: [],
      commits: [
        {
          script:
            "BEGIN TRANSACTION;\nSELECT * FROM user;\nCOMMIT TRANSACTION;",
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              statement: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              statement: "COMMIT TRANSACTION;",
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        },  {
          script:
            "BEGIN TRANSACTION;\nSELECT * FROM user;\nCOMMIT TRANSACTION;",
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              statement: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              statement: "COMMIT TRANSACTION;",
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 3,
    name: 'Missing start & end transaction',
    script: `SELECT * FROM user;`,
    params: [],
    result: {
      script: "BEGIN TRANSACTION;\nSELECT * FROM user;",
      params: [],
      commits: [
        {
          script:
            "BEGIN TRANSACTION;\nSELECT * FROM user;",
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              statement: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              type: ParseType.select_data
            }
          ]
        }
      ],
      isLong: false,
      isWait: true
    },
    isSkip: false
  }, {
    id: 4,
    name: 'Missing start & end transaction - Multiple',
    script: `SELECT * FROM user;
BEGIN TRANSACTION;
SELECT * FROM user;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
SELECT * FROM user;
COMMIT TRANSACTION;
BEGIN TRANSACTION;
SELECT * FROM user;
COMMIT TRANSACTION;`,
      params: [],
      commits: [
        {
          script:
            "BEGIN TRANSACTION;\nSELECT * FROM user;\nCOMMIT TRANSACTION;",
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              statement: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              statement: "COMMIT TRANSACTION;",
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        },  {
          script:
            "BEGIN TRANSACTION;\nSELECT * FROM user;\nCOMMIT TRANSACTION;",
          params: [],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              params: [],
              statement: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              type: ParseType.select_data
            }, {
              isRead: false,
              params: [],
              statement: "COMMIT TRANSACTION;",
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isWait: false
    },
    isSkip: false
  },
];

describe('CommitList - Load & Save.', function () {
  for (const test of loadTests) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const commits = new CommitList({
        script: test.script,
        params: test.params
      });

      commits.save();

      // Copy and cleanup the commits.
      const result: CommitArg = commits.toObject();

      expect(result).to.be.deep.equal(test.result);
    });
  }
});