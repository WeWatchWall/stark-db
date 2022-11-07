import { expect } from 'chai';
import { existsSync,rmSync } from 'fs';

import { AdminDB } from '../src/server/DBAdmin';

describe('Server DB.', function () {
  this.timeout(600e3);

  this.beforeAll(async () => {
    const dbDile = './test/test.db';

    // Delete the database file if it exists.
    if (existsSync(dbDile)) {
      rmSync(dbDile);
    }
  });

  it(`Hello world.`, async () => {
    const adminDB = new AdminDB({
      name: 'test.db',
      path: './test'
    });

    await adminDB.validator.readyAsync();

    expect(true).to.be.equal(true);
  });
});