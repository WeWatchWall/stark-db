import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ScriptParse } from '../../src/parser/scriptParse';
import { ParseType } from '../../src/parser/queryParse';

const tests = [
  {
    id: 0,
    name: 'Empty',
    script: '',
    params: [] as any[],
    result: {
      isReadOnly: true,
      queries: [] as any[],
    },
  },
  {
    id: 1,
    name: 'One statement',
    script: 'SELECT * FROM users;',
    params: [] as any[],
    result: {
      isReadOnly: true,
      queries: [
        {
          autoKeys: [],
          columns: [],
          isRead: false,
          keys: [],
          params: [],
          query: 'SELECT * FROM users;',
          tablesRead: [
            'users'
          ],
          tablesWrite: [],
          type: ParseType.select_data
        }
      ]
    },
  },
  {
    id: 2,
    name: 'Two statements',
    script: `-- This is a sample script
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER
);

INSERT INTO users (name, age) VALUES (?, ?);`,
    params: ['John Doe', 42],
    result: {
      isReadOnly: false,
      queries: [
        {
          autoKeys: [],
          columns: ['id', 'name', 'age'],
          isRead: false,
          keys: ['id'],
          params: [],
          query: `-- This is a sample script
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER
);`,
          tablesRead: [],
          tablesWrite: ['users'],
          type: ParseType.create_table
        },
        {
          autoKeys: [],
          columns: [],
          isRead: false,
          keys: [],
          params: ['John Doe', 42],
          query: 'INSERT INTO users (name, age) VALUES (?, ?);',
          tablesRead: [],
          tablesWrite: [
            'users'
          ],
          type: ParseType.modify_data
        }
      ]
    },
  },
  {
    id: 3,
    name: 'Three statements',
    script: `-- This is a sample script
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER
);

INSERT INTO users (name, age) VALUES (?, ?);
INSERT INTO variables (name, value, isTest) VALUES (?, ?, ?);
`,
    params: ['John Doe', 42, 'test', 1, true],
    result: {
      isReadOnly: false,
      queries: [
        {
          autoKeys: [],
          columns: ['id', 'name', 'age'],
          isRead: false,
          keys: ['id'],
          params: [],
          query: `-- This is a sample script
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT,
  age INTEGER
);`,
          tablesRead: [],
          tablesWrite: ['users'],
          type: ParseType.create_table
        },
        {
          autoKeys: [],
          columns: [],
          isRead: false,
          keys: [],
          params: ['John Doe', 42],
          query: 'INSERT INTO users (name, age) VALUES (?, ?);',
          tablesRead: [],
          tablesWrite: ['users'],
          type: ParseType.modify_data
        },
        {
          autoKeys: [],
          columns: [],
          isRead: false,
          keys: [],
          params: ['test', 1, true],
          query: 'INSERT INTO variables (name, value, isTest) VALUES (?, ?, ?);',
          tablesRead: [],
          tablesWrite: ['variables'],
          type: ParseType.modify_data
        }
      ]
    },
  },
  {
    id: 4,
    name: 'Three statements with trigger',
    script: `
INSERT INTO users (name, age) VALUES (?, ?);

CREATE TRIGGER
IF NOT EXISTS test
  AFTER INSERT
  ON test
BEGIN
  UPDATE test SET version = (SELECT value FROM test WHERE name = ?) WHERE ROWID = NEW.ROWID;
END;

INSERT INTO variables (name, value, isTest) VALUES (?, ?, ?);
`,
    params: ['John Doe', 42, 'blue', 'test', 1, true],
    result: {
      isReadOnly: false,
      queries: [
        {
          autoKeys: [],
          columns: [],
          isRead: false,
          keys: [],
          params: ['John Doe', 42],
          query: 'INSERT INTO users (name, age) VALUES (?, ?);',
          tablesRead: [],
          tablesWrite: ['users'],
          type: ParseType.modify_data
        },
        {
          autoKeys: [],
          columns: [],
          isRead: true,
          keys: [],
          params: ['blue'],
          query: `CREATE TRIGGER
IF NOT EXISTS test
  AFTER INSERT
  ON test
BEGIN
  UPDATE test SET version = (SELECT value FROM test WHERE name = ?) WHERE ROWID = NEW.ROWID;
END;`,
          tablesRead: [],
          tablesWrite: [],
          type: ParseType.other
        },
        {
          autoKeys: [],
          columns: [],
          isRead: false,
          keys: [],
          params: ['test', 1, true],
          query: 'INSERT INTO variables (name, value, isTest) VALUES (?, ?, ?);',
          tablesRead: [],
          tablesWrite: ['variables'],
          type: ParseType.modify_data
        }
      ]
    },
  }
];

describe('Parses scripts', () => {
  for (const test of tests) {
    it(`${test.id}: ${test.name}`, () => {
      const scriptParse = new ScriptParse({
        script: test.script,
        params: test.params,
      });

      assert.deepStrictEqual(scriptParse.toObject(), test.result);
    });
  }
});
