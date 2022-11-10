import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

import { Database } from '../../src/entity/DB';
import { User } from '../../src/entity/user';
import { AdminDB } from '../../src/server/objects/DBAdmin';
import { ADMIN_USER } from '../../src/utils/constants';

const ADMIN_DB_TEST = `stark-admin-test.db`;
const DB_PATH = `./test`;

describe('Server: Admin DB.', function () {
  // this.timeout(600e3);

  this.beforeAll(async () => {
    const DBPath = resolve(DB_PATH, ADMIN_DB_TEST);

    // Delete the database file if it exists.
    if (existsSync(DBPath)) {
      rmSync(DBPath);
    }
  });

  it(`Inits DB.`, async () => {
    // Create the admin database.
    const adminDB = new AdminDB({
      name: ADMIN_DB_TEST,
      path: DB_PATH,
    });
    await adminDB.validator.readyAsync();

    // Check the user exists in the table.
    const users = await adminDB
      .DB
      .manager
      .findBy(User, { userName: ADMIN_USER });
    expect(users.length).to.be.equal(1);
    const user = users[0];
    expect(user).to.be.deep.equal({
      id: 1,
      userName: ADMIN_USER,
      password: '',
      salt: '',
    });

    // Check the database exists in the table.
    const DBs = await adminDB
      .DB
      .manager
      .findBy(Database, { name: ADMIN_DB_TEST });
    expect(DBs.length).to.be.equal(1);
    const DB = DBs[0];
    expect(DB).to.be.deep.equal({
      id: 1,
      name: ADMIN_DB_TEST,
      path: DB_PATH,
    });
  });

  it(`Avoids double initialization.`, async () => {
    // Create the admin database.
    const adminDB = new AdminDB({
      name: ADMIN_DB_TEST,
      path: DB_PATH,
    });
    await adminDB.validator.readyAsync();

    // Check the user is the only one in the table.
    const users = await adminDB
      .DB
      .manager
      .findBy(User, { userName: ADMIN_USER });
    expect(users.length).to.be.equal(1);

    // Check the database is the only one in the table.
    const DBs = await adminDB
      .DB
      .manager
      .findBy(Database, { name: ADMIN_DB_TEST });
    expect(DBs.length).to.be.equal(1);
  });
});