import assert from 'node:assert';
import { describe, it } from 'node:test';
import workerpool from 'workerpool';

describe('Tests', () => {
  it('should run', () => {
    assert.strictEqual(1, 1);
  });
});

describe('Workerpool', () => {
  it('should run', async () => {
    const pool = workerpool.pool();

    function add(a: number, b: number) {
      return a + b;
    }

    const result = await pool.exec(add, [1, 2]);
    assert.strictEqual(result, 3);

    pool.terminate();
  });
});