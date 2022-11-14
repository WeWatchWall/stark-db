import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

import { Database } from '../../src/entity/DB';
import { User } from '../../src/entity/user';
import { AdminDB } from '../../src/server/objects/DBAdmin';
import { UserManager } from '../../src/services/userManager';
import { ADMIN_DB, ADMIN_USER } from '../../src/utils/constants';

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

  it(`Init`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    // Optional because it is already called and is idemnpotent.
    await userManager.validator.readyAsync();

    expect(!!UserManager.adminDB).to.be.equal(true);
  });

  /* #region  Add tests. */
  it(`Add`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(1);

    const newUserData = {
      userName: `test`,
      password: `password`,
      salt: `salt`,
    };

    const newUser = await userManager.add(newUserData);

    expect(newUser).to.be.deep.equal(Object.assign({ id: 2 }, newUserData));

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPost).to.be.equal(numUsersPre + 1);
  });

  it(`Add: duplicate fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const newUserData = {
      userName: `test`,
      password: `password`,
      salt: `salt`,
    };

    let error: any;
    try {
      await userManager.add(newUserData);
    } catch (err) {
      error = err;
    }

    expect(error).to.not.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost);
  });

  it(`Add: id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const newUserData = {
      id: 3,
      userName: `test`,
      password: `password`,
      salt: `salt`,
    };

    const newUser = await userManager.add(newUserData);

    expect(newUser).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost);
  });

  it(`Add: admin id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const newUserData = {
      id: 1,
      userName: `test`,
      password: `password`,
      salt: `salt`,
    };

    const newUser = await userManager.add(newUserData);

    expect(newUser).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost);
  });

  it(`Add: admin name fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const newUserData = {
      userName: ADMIN_USER,
      password: `password`,
      salt: `salt`,
    };

    const newUser = await userManager.add(newUserData);

    expect(newUser).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost);
  });
  /* #endregion */

  /* #region  Set tests */
  it(`Set`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(2);

    const newUserData = {
      id: 2,
      userName: `test1`,
      password: `password1`,
      salt: `salt1`,
    };

    const newUser = await userManager.set(newUserData);

    expect(newUser).to.be.deep.equal(newUserData);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPost).to.be.equal(numUsersPre);
  });

  it(`Set: no id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(2);

    const newUserData = {
      userName: `test1`,
      password: `password1`,
      salt: `salt1`,
    };

    const newUser = await userManager.set(newUserData);

    expect(newUser).to.be.undefined;
  });

  it(`Set: admin id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(2);

    const newUserData = {
      id: 1,
      userName: `test1`,
      password: `password1`,
      salt: `salt1`,
    };

    const newUser = await userManager.set(newUserData);

    expect(newUser).to.be.undefined;
  });

  it(`Set: admin name fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(2);

    const newUserData = {
      id: 2,
      userName: ADMIN_USER,
      password: `password1`,
      salt: `salt1`,
    };

    const newUser = await userManager.set(newUserData);

    expect(newUser).to.be.undefined;
  });
  /* #endregion */

  /* #region  Get tests. */
  it(`Get`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(2);

    const newUser = await userManager.get({
      userName: `test1`,
    });

    expect(newUser).to.not.be.undefined;
  });

  it(`Get: admin`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(2);

    const newUser = await userManager.get({
      id: 1,
    });

    expect(newUser).to.not.be.undefined;
  });

  it(`Get: no id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(2);

    const newUser = await userManager.get({
      password: `password1`,
      salt: `salt1`,
    });

    expect(newUser).to.be.undefined;
  });
  /* #endregion */

  /* #region  Delete tests. */
  it(`Delete`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const deleteResult = await userManager.del({ id: 2 });

    expect(deleteResult.id).to.be.equal(2);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost + 1);
  });

  it(`Delete: no id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const deleteResult = await userManager.del({
      password: `password`,
      salt: `salt`,
    });

    expect(deleteResult).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost);
  });

  it(`Delete: admin id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const deleteResult = await userManager.del({ id: 1 });

    expect(deleteResult).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost);
  });

  it(`Delete: admin name fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const deleteResult = await userManager.del({ userName: ADMIN_USER });

    expect(deleteResult).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    expect(numUsersPre).to.be.equal(numUsersPost);
  });

  // NOTE: This test has to be last.
  it(`Destroy`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    await userManager.destroy();

    expect(!UserManager.adminDB).to.be.equal(true);
  });
  /* #endregion */
});