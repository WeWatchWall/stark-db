import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

import { Database } from '../../src/entity/DB';
import { User } from '../../src/entity/user';
import { AdminDB } from '../../src/server/objects/DBAdmin';
import { UserManager } from '../../src/services/userManager';
import { ADMIN_DB } from '../../src/utils/constants';

const DB_PATH = `./test`;

describe('Server: User Manager.', function () {
  // this.timeout(600e3);

  this.beforeAll(async () => {
    const DBPath = resolve(DB_PATH, ADMIN_DB);

    // Delete the database file if it exists.
    if (existsSync(DBPath)) {
      rmSync(DBPath);
    }

    // Create the admin database instance.
    global.adminDB = new AdminDB({
      name: ADMIN_DB,
      path: DB_PATH,
      entities: [User, Database]
    });
    await global.adminDB.validator.readyAsync();
  });

  it(`User Manager: init`, async () => {
    await UserManager.init({
      DB: global.adminDB,
    });

    expect(!!UserManager.adminDB).to.be.equal(true);
  });

  // NOTE: This test has to be last.
  it(`User Manager: destroy`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    await userManager.destroy();

    expect(!UserManager.adminDB).to.be.equal(true);
  });
});