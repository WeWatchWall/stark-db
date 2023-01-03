import { expect } from 'chai';

import { CommitArg } from '../src/objects/commit';
import { CommitList, CommitListMem } from '../src/objects/commitList';
import { ParseType } from '../src/objects/queryParse';
import { ONE, VARS_TABLE, ZERO } from '../src/utils/constants';
import { Variable } from '../src/utils/variable';

const tests = [
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
      isSchema: false,
      isMemory: true,
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
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              columns: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isSchema: false,
      isMemory: true,
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
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              columns: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isSchema: false,
      isMemory: true,
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
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              columns: [],
              keys: [],
              type: ParseType.select_data
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: true,
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
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              columns: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
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
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              columns: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isSchema: false,
      isMemory: true,
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
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              columns: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
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
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "SELECT * FROM user;",
              tables: [
                "user"
              ],
              columns: [],
              keys: [],
              type: ParseType.select_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              params: [],
              query: "COMMIT TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isSchema: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  },
  /* #endregion */

  /* #region  Manage the flags. */
  {
    id: 6,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variable.isWAL}";`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 7,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variable.isMemory}";`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: false,
      isSchema: false,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 8,
    name: 'Flags - Update IN query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id IN ("${Variable.isWAL}", "${Variable.isMemory}");`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 9,
    name: 'Flags - Insert or replace query',
    script: `REPLACE INTO ${VARS_TABLE} VALUES ("${Variable.isWAL}", ?);`,
    params: [ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 10,
    name: 'Flags - Query with params',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?);`,
    params: [Variable.isWAL, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 11,
    name: 'Flags - Query with params 2',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?), (?, ?);`,
    params: [Variable.isWAL, ZERO, Variable.isMemory, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 12,
    name: 'Flags - Query with params 3',
    script: `REPLACE INTO ${VARS_TABLE} VALUES (?, ?), ("${Variable.isMemory}", ?);`,
    params: [Variable.isWAL, ZERO, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  }, {
    id: 13,
    name: 'Flags - Query with params 4',
    script: `REPLACE INTO ${VARS_TABLE} VALUES ("${Variable.isMemory}", ?), (?, ?);`,
    params: [ZERO, Variable.isWAL, ZERO],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: false,
      isWait: false
    },
    isSkip: false
  },
  /* #endregion */

  /* #region  Manage the schema. */
  {
    id: 14,
    name: 'Schema - Add table',
    script: `CREATE TABLE IF NOT EXISTS "variables" ("id" VARCHAR PRIMARY KEY NOT NULL, "value" text NOT NULL);`,
    params: [],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
CREATE TABLE IF NOT EXISTS \"variables\" (\"id\" VARCHAR PRIMARY KEY NOT NULL, \"value\" text NOT NULL);
CREATE TABLE IF NOT EXISTS \"_stark_diffs_variables\" (\"id\" VARCHAR PRIMARY KEY NOT NULL, \"value\" text NOT NULL);
DROP TRIGGER IF EXISTS _stark_trigger_add_variables;
CREATE TRIGGER
IF NOT EXISTS _stark_trigger_add_variables
  AFTER insert
  ON variables
  WHEN (SELECT value FROM _stark_vars WHERE id = \"isWAL\") IN (1)
BEGIN
  INSERT INTO _stark_diffs_variables
  VALUES (NEW.id, NEW.value);
END;
DROP TRIGGER IF EXISTS _stark_trigger_set_variables;
CREATE TRIGGER
IF NOT EXISTS _stark_trigger_set_variables
  AFTER update
  ON variables
  WHEN (SELECT value FROM _stark_vars WHERE id = \"isWAL\") IN (1)
BEGIN
  INSERT INTO _stark_diffs_variables
  VALUES (NEW.id, NEW.value);
END;
REPLACE INTO _stark_tables VALUES (?, ?, ?, ?);
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, 'variables', '["id"]', ONE, ZERO, ONE],
      commits: [{
        script: `BEGIN TRANSACTION;
UPDATE _stark_vars SET value = ? WHERE id = \"isWAL\";
CREATE TABLE IF NOT EXISTS \"variables\" (\"id\" VARCHAR PRIMARY KEY NOT NULL, \"value\" text NOT NULL);
CREATE TABLE IF NOT EXISTS \"_stark_diffs_variables\" (\"id\" VARCHAR PRIMARY KEY NOT NULL, \"value\" text NOT NULL);
DROP TRIGGER IF EXISTS _stark_trigger_add_variables;
CREATE TRIGGER
IF NOT EXISTS _stark_trigger_add_variables
  AFTER insert
  ON variables
  WHEN (SELECT value FROM _stark_vars WHERE id = \"isWAL\") IN (1)
BEGIN
  INSERT INTO _stark_diffs_variables
  VALUES (NEW.id, NEW.value);
END;
DROP TRIGGER IF EXISTS _stark_trigger_set_variables;
CREATE TRIGGER
IF NOT EXISTS _stark_trigger_set_variables
  AFTER update
  ON variables
  WHEN (SELECT value FROM _stark_vars WHERE id = \"isWAL\") IN (1)
BEGIN
  INSERT INTO _stark_diffs_variables
  VALUES (NEW.id, NEW.value);
END;
REPLACE INTO _stark_tables VALUES (?, ?, ?, ?);
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
        params: [ZERO, 'variables', '["id"]', ONE, ZERO, ONE],
        statements: [{
          query: `BEGIN TRANSACTION;`,
          params: [],
          type: ParseType.begin_transaction,
          isRead: false,
          tables: [],
          columns: [],
          keys: []
        }, {
          query: `UPDATE _stark_vars SET value = ? WHERE id = "isWAL";`,
          params: [ZERO],
          type: ParseType.modify_data,
          isRead: false,
          tables: ["_stark_vars"],
          columns: [],
          keys: []
        }, {
          query: `CREATE TABLE IF NOT EXISTS "variables" ("id" VARCHAR PRIMARY KEY NOT NULL, "value" text NOT NULL);`,
          params: [],
          type: ParseType.create_table,
          isRead: false,
          tables: ["variables"],
          columns: ["id", "value"],
          keys: ["id"]
        }, {
          query: `CREATE TABLE IF NOT EXISTS "_stark_diffs_variables" ("id" VARCHAR PRIMARY KEY NOT NULL, "value" text NOT NULL);`,
          params: [],
          type: ParseType.create_table,
          isRead: false,
          tables: ["_stark_diffs_variables"],
          columns: ["id", "value"],
          keys: ["id"]
        }, {
          query: `DROP TRIGGER IF EXISTS _stark_trigger_add_variables;`,
          params: [],
          type: ParseType.other,
          isRead: false,
          tables: [],
          columns: [],
          keys: []
        }, {
          query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_add_variables
  AFTER insert
  ON variables
  WHEN (SELECT value FROM _stark_vars WHERE id = "isWAL") IN (1)
BEGIN
  INSERT INTO _stark_diffs_variables
  VALUES (NEW.id, NEW.value);
END;`,
          params: [],
          type: ParseType.other,
          isRead: true,
          tables: [],
          columns: [],
          keys: []
        }, {
          query: `DROP TRIGGER IF EXISTS _stark_trigger_set_variables;`,
          params: [],
          type: ParseType.other,
          isRead: false,
          tables: [],
          columns: [],
          keys: []
        }, {
          query: `CREATE TRIGGER
IF NOT EXISTS _stark_trigger_set_variables
  AFTER update
  ON variables
  WHEN (SELECT value FROM _stark_vars WHERE id = "isWAL") IN (1)
BEGIN
  INSERT INTO _stark_diffs_variables
  VALUES (NEW.id, NEW.value);
END;`,
          params: [],
          type: ParseType.other,
          isRead: true,
          tables: [],
          columns: [],
          keys: []
        }, {
          query: `REPLACE INTO _stark_tables VALUES (?, ?, ?, ?);`,
          params: ["variables", '["id"]', ONE, ZERO],
          type: ParseType.modify_data,
          isRead: false,
          tables: ["_stark_tables"],
          columns: [],
          keys: []
        }, {
          query: `UPDATE _stark_vars SET value = ? WHERE id IN ("isWAL", "isMemory");`,
          params: [ONE],
          type: ParseType.modify_data,
          isRead: false,
          tables: ["_stark_vars"],
          columns: [],
          keys: []
        }, {
          query: `COMMIT TRANSACTION;`,
          params: [],
          type: ParseType.commit_transaction,
          isRead: false,
          tables: [],
          columns: [],
          keys: []
        }]
      }],
      isLong: false,
      isSchema: true,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  },
  /* #endregion */
];

describe('CommitList - Load & Save.', function () {
  for (const test of tests) {
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

const testsMem = [

  /* #region  Flags. */
  {
    id: 0,
    name: 'Empty',
    script: '',
    params: [],
    tables: [],
    result: {
      script: '',
      params: [],
      commits: [],
      isLong: false,
      isSchema: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, {
    id: 1,
    name: 'Flags - Update query',
    script: `UPDATE ${VARS_TABLE} SET value = 1 WHERE id = "${Variable.isWAL}";`,
    params: [ZERO],
    tables: [VARS_TABLE],
    result: {
      script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
      params: [ZERO, ONE],
      commits: [
        {
          script: `BEGIN TRANSACTION;
UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";
UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");
COMMIT TRANSACTION;`,
          params: [ZERO, ONE],
          statements: [
            {
              isRead: false,
              params: [],
              query: "BEGIN TRANSACTION;",
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.begin_transaction
            }, {
              isRead: false,
              query:
                `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
              params: [ZERO],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query:
                `UPDATE _stark_vars SET value = ? WHERE id IN (\"isWAL\", \"isMemory\");`,
              params: [ONE],
              tables: [
                VARS_TABLE
              ],
              columns: [],
              keys: [],
              type: ParseType.modify_data
            }, {
              isRead: false,
              query: "COMMIT TRANSACTION;",
              params: [],
              tables: [],
              columns: [],
              keys: [],
              type: ParseType.commit_transaction
            }
          ]
        }
      ],
      isLong: true,
      isSchema: false,
      isMemory: true,
      isWait: false
    },
    isSkip: false
  }, 
  /* #endregion */
];


describe('CommitList Memory - Load & Save.', function () {
  for (const test of testsMem) {
    if (test.isSkip) { continue; }

    it(`${test.id}: ${test.name}`, async () => {
      const commits = new CommitListMem({
        script: test.script,
        params: test.params,
        tables: test.tables
      });

      commits.save();

      // Copy and cleanup the commits.
      const result: CommitArg = commits.toObject();

      expect(result).to.be.deep.equal(test.result);
    });
  }
});