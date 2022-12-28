import { expect } from 'chai';

import { CommitArg } from '../src/objects/commit';
import { CommitList } from '../src/objects/commitList';
import { ParseType } from '../src/objects/statement';
import { ONE, VARS_TABLE, ZERO } from '../src/utils/constants';
import { Variables } from '../src/utils/variables';

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
      isMemory: false,
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
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
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
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: false,
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
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
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
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 3,
    name: 'Split - Missing end transaction',
    script: `BEGIN TRANSACTION;
SELECT * FROM user;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;`,
      params: [ZERO],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;`,
          params: [ZERO],
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
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
            }
          ]
        }
      ],
      isLong: true,
      isMemory: false,
      isWait: true
    },
    isSkip: false
  }, {
    id: 4,
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
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;
BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE, ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
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
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
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
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 5,
    name: 'Split - Missing start & end transaction - Multiple',
    script: `SELECT * FROM user;
BEGIN TRANSACTION;
SELECT * FROM user;`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;
BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE, ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
SELECT * FROM user;
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
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
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
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
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: false,
      isWait: false
    },
    isSkip: false
  },
  /* #endregion */

  /* #region  Manage the isWAL flag. */
  {
    id: 6,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variables.isWAL}";`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 7,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variables.isMemory}";`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isLong: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 8,
    name: 'Flags - Update IN query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id IN ("${Variables.isWAL}", "${Variables.isMemory}");`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 9,
    name: 'Flags - Insert or replace query',
    script: `REPLACE INTO ${VARS_TABLE} VALUES ("${Variables.isWAL}", ?);`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 10,
    name: 'Flags - Query with params',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?);`,
    params: [Variables.isWAL, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 11,
    name: 'Flags - Query with params 2',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?), (?, ?);`,
    params: [Variables.isWAL, ZERO, Variables.isMemory, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 12,
    name: 'Flags - Query with params 3',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?), ("${Variables.isMemory}", ?);`,
    params: [Variables.isWAL, ZERO, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 13,
    name: 'Flags - Query with params 4',
    script: `REPLACE INTO ${VARS_TABLE} VALUES ("${Variables.isMemory}", ?), (?, ?);`,
    params: [ZERO, Variables.isWAL, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
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
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variables.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              type: ParseType.modify_data
            }, {
              isRead: false,
              statement:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
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
      isMemory: true,
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