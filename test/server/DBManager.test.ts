import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { DatabaseManager } from '../../src/server/services/DBManager';

const DB_PATH = `./test`;
const DB_FILE = `${DB_PATH}/stark-admin.db`;

describe('Server DB Manager.', function () {
  this.timeout(600e3);

  this.beforeAll(async () => {
    // Delete the database file if it exists.
    if (existsSync(DB_FILE)) {
      rmSync(DB_FILE);
    }
  });

  it(`Hello world.`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    await dbManager.validator.readyAsync();

    expect(true).to.be.equal(true);
  });
});