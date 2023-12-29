import assert from 'node:assert';
import { describe, it } from 'node:test';

import sqliteParser from '@appland/sql-parser';

const tests: any[] = [
  {
    id: 0,
    name: 'Empty script',
    script: '',
    result: undefined,
  },
  {
    id: 1,
    name: 'Single statement',
    script: 'SELECT * FROM foo;',
    result: undefined,
  },
  {
    id: 2,
    name: 'Single statement, trigger',
    script: `
      CREATE TRIGGER
      IF NOT EXISTS test
        AFTER INSERT
        ON test
      BEGIN
        UPDATE test SET version = (SELECT value FROM test WHERE name = "1") WHERE ROWID = NEW.ROWID;
      END;
    `,
    result: undefined,
  },
  {
    id: 3,
    name: 'Multiple statements',
    script: `
      BEGIN TRANSACTION;
      SELECT * FROM foo;
    `,
    result: undefined,
  },
  {
    id: 4,
    name: 'Error, single statement, trigger',
    script: `
      CREATE TRIGGER
      IF NOT EXISTS test
        AFTER INSERT
        ON test
      BEGIN
        UPDATE test SET version = (SELECT value FROM test WHERE name = "1") WHERE ROWID = NEW.ROWID;
    `,
    result: 'Syntax error found near Identifier (WITH Clause)',
  },
  {
    id: 5,
    name: 'Error, multiple statements, trigger',
    script: `
      BEGIN TRANSACTION;
      CREATE TRIGGER
      IF NOT EXISTS test
        AFTER INSERT
        ON test
      BEGIN
        UPDATE test SET version = (SELECT value FROM test WHERE name = "1") WHERE ROWID = NEW.ROWID;
    `,
    result: 'Syntax error found near Identifier (WITH Clause)',
  },
];

function parseScript(script: string) {
  return sqliteParser(script);
}

describe('rawParse', () => {
  for (const test of tests) {
    it(`${test.id}: ${test.name}`, () => {
      let error;
      try {
        parseScript(test.script);
      } catch (e: any) {
        error = e;
      }

      assert.deepStrictEqual(test.result, error?.message);
    });
  }
});