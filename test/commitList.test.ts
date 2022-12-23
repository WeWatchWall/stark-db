import { expect } from 'chai';

import { CommitArg } from '../src/objects/commit';
import { CommitList } from '../src/objects/commitList';
import { ParseType } from '../src/objects/statement';
import { isWAL_VAR, ONE, VARS_TABLE, ZERO } from '../src/utils/constants';

const loadTests = [
  /* #region  Split transactions. */
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
    name: 'Split - Missing start & end transaction',
    script: `SELECT * FROM user;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
    name: 'Split - Missing start transaction',
    script: `SELECT * FROM user;
COMMIT TRANSACTION;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
    name: 'Split - Missing start transaction - Multiple',
    script: `SELECT * FROM user;
COMMIT TRANSACTION;
BEGIN TRANSACTION;
SELECT * FROM user;
COMMIT TRANSACTION;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;
BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
      params: [ZERO, ONE, ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              statement: "COMMIT TRANSACTION;",
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        }, {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
    id: 4,
    name: 'Split - Missing start & end transaction - Multiple',
    script: `SELECT * FROM user;
BEGIN TRANSACTION;
SELECT * FROM user;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;
BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
      params: [ZERO, ONE, ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              statement: "COMMIT TRANSACTION;",
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        }, {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
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
  /* #endregion */

  /* #region  Manage the isWAL flag. */
  {
    id: 5,
    name: 'isWAL - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${isWAL_VAR}";`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              statement: "BEGIN TRANSACTION;",
              tables: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${isWAL_VAR}";`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isWait: false
    },
    isSkip: false
  }
  /* #endregion */

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