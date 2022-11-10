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

  it(`User Manager: init`, async () => {
    await UserManager.init({
      DB: global.adminDB,
    });

    expect(!!UserManager.adminDB).to.be.equal(true);
  });

  it(`User Manager: add`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    
    // Optional because it is already called and is idemnpotent.
    await userManager.validator.readyAsync();

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
    
    expect(numUsersPost).to.be.equal(2);
  });

  it(`User Manager: add admin fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    
    // Optional because it is already called and is idemnpotent.
    await userManager.validator.readyAsync();

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const newUserData = {
      userName: `admin`,
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

  it(`User Manager: add admin id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    
    // Optional because it is already called and is idemnpotent.
    await userManager.validator.readyAsync();

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

  it(`User Manager: delete`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    
    // Optional because it is already called and is idemnpotent.
    await userManager.validator.readyAsync();

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const deleteResult = await userManager.delete({ id: 2 });

    expect(deleteResult.id).to.be.equal(2);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);
    
    expect(numUsersPre).to.be.equal(numUsersPost + 1);
  });

  it(`User Manager: delete admin fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    
    // Optional because it is already called and is idemnpotent.
    await userManager.validator.readyAsync();

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const deleteResult = await userManager.delete({ userName: ADMIN_USER });

    expect(deleteResult).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);
    
    expect(numUsersPre).to.be.equal(numUsersPost);
  });

  it(`User Manager: delete admin id fail`, async () => {
    const userManager = await UserManager.init({
      DB: global.adminDB,
    });
    
    // Optional because it is already called and is idemnpotent.
    await userManager.validator.readyAsync();

    const numUsersPre = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);

    const deleteResult = await userManager.delete({ id: 1 });

    expect(deleteResult).to.be.equal(undefined);

    const numUsersPost = await UserManager
      .adminDB
      .DB
      .manager
      .count(User);
    
    expect(numUsersPre).to.be.equal(numUsersPost);
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