import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';

import { AdminDB } from '../../src/server/objects/DBAdmin';

const DB_PATH = `./test`;
const DB_FILE = 'test.db';

describe('Admin DB.', function () {
  this.timeout(600e3);

  this.beforeAll(async () => {
    // Delete the database file if it exists.
    if (existsSync(`${DB_PATH}/${DB_FILE}`)) {
      rmSync(`${DB_PATH}/${DB_FILE}`);
    }
  });

  it(`Hello world.`, async () => {
    const adminDB = new AdminDB({
      name: DB_FILE,
      path: DB_PATH,
    });

    await adminDB.validator.readyAsync();

    expect(true).to.be.equal(true);
  });
});