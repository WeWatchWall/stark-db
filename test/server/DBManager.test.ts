import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { Database } from '../../src/entity/DB';
import { DatabaseManager } from '../../src/server/services/DBManager';
import { DatabaseManagerBase } from '../../src/services/DBManager';

const DB_PATH = `./test`;
const ADMIN_DB_FILE = `stark-admin.db`;
const DB_FILE = `test.db`;
const DB_FILE2 = `test2.db`;

describe('Server: DB Manager.', function () {
  // this.timeout(600e3);

  this.beforeAll(async () => {
    // Delete the database file if it exists.
    const ADMIN_DB_FILE_PATH = resolve(DB_PATH, ADMIN_DB_FILE);
    if (existsSync(ADMIN_DB_FILE_PATH)) {
      rmSync(ADMIN_DB_FILE_PATH);
    }

    const DB_FILE_PATH = resolve(DB_PATH, DB_FILE);
    if (existsSync(DB_FILE_PATH)) {
      rmSync(DB_FILE_PATH);
    }

    // Should be optional...in case the set test fails in the wrong spot.
    const DB_FILE_PATH2 = resolve(DB_PATH, DB_FILE2);
    if (existsSync(DB_FILE_PATH2)) {
      rmSync(DB_FILE_PATH2);
    }
  });

  it(`DB Manager: init`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

    expect(DatabaseManagerBase.adminDB).to.not.be.equal(undefined);
  });

  it(`DB Manager: destroy`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    await dbManager.validator.readyAsync();
    await dbManager.destroy();

    expect(DatabaseManagerBase.adminDB).to.be.equal(undefined);
  });

  /* #region  Add tests. */
  it(`DB Manager: add`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPre).to.be.equal(1);

    const newDB = await dbManager.add({
      name: DB_FILE,
    });

    expect(newDB.id).to.be.equal(2);
    expect(newDB.userDB).to.not.be.undefined;

    await newDB.userDB.destroy();

    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPost).to.be.equal(numDBsPre + 1);

    const DB = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .findOneBy(Database, {
        id: 2,
        name: DB_FILE,
      });

    expect(DB).to.be.deep.equal({
      id: 2,
      name: DB_FILE,
      path: DB_PATH,
    });
  });

  it(`DB Manager: add duplicate fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    let error: any;
    try {
      await dbManager.add({
        name: DB_FILE,
      });
    } catch (err) {
      error = err;
    }
    expect(error).to.not.be.equal(undefined);

    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPost).to.be.equal(numDBsPre);
  });

  it(`DB Manager: add id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const newDB = await dbManager.add({
      id: 3,
      name: `something.db`,
    });

    expect(newDB).to.be.equal(undefined);

    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPost).to.be.equal(numDBsPre);
  });

  it(`DB Manager: add admin id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const newDB = await dbManager.add({
      id: 1,
      name: DB_FILE,
    });

    expect(newDB).to.be.equal(undefined);

    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPost).to.be.equal(numDBsPre);
  });

  it(`DB Manager: add admin name fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const newDB = await dbManager.add({
      name: ADMIN_DB_FILE,
    });

    expect(newDB).to.be.equal(undefined);

    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPost).to.be.equal(numDBsPre);
  });
  /* #endregion */

  /* #region  Set tests. */
  it(`DB Manager: set`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPre).to.be.equal(2);

    const newDB = await dbManager.set({
      id: 2,
      name: DB_FILE2,
    });

    expect(newDB.id).to.be.equal(2);
    expect(newDB.userDB).to.not.be.undefined;

    await newDB.userDB.destroy();

    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPost).to.be.equal(numDBsPre);

    const DB = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .findOneBy(Database, {
        id: 2,
        name: DB_FILE2,
      });

    expect(DB).to.be.deep.equal({
      id: 2,
      name: DB_FILE2,
      path: DB_PATH,
    });

    // Reset DB_FILE2 -> DB_FILE.
    const newDB2 = await dbManager.set({
      id: 2,
      name: DB_FILE,
    });
    await newDB2.userDB.destroy();
  });

  it(`DB Manager: set no id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const newDB = await dbManager.set({
      path: DB_PATH,
    });

    expect(newDB).to.be.equal(undefined);
  });

  it(`DB Manager: set admin id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const newDB = await dbManager.set({
      id: 1,
      name: `something.db`,
    });

    expect(newDB).to.be.equal(undefined);
  });

  it(`DB Manager: set admin name fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

    const newDB = await dbManager.set({
      id: 2,
      name: ADMIN_DB_FILE,
    });

    expect(newDB).to.be.equal(undefined);
  });
  /* #endregion */

  /* #region  Get tests. */
  it(`DB Manager: get`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const newDB = await dbManager.get({
      name: DB_FILE,
    });

    expect(newDB).to.not.be.equal(undefined);
    expect(newDB.userDB).to.not.be.equal(undefined);

    await newDB.userDB.destroy();
  });

  it(`DB Manager: get admin`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const newDB = await dbManager.get({
      name: ADMIN_DB_FILE,
    });

    expect(newDB).to.not.be.equal(undefined);
    expect(newDB.userDB).to.not.be.equal(undefined);

    await newDB.userDB.destroy();
  });

  it(`DB Manager: get no id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const newDB = await dbManager.get({
      path: DB_PATH,
    });

    expect(newDB).to.be.equal(undefined);
  });
  /* #endregion */

  /* #region  Delete tests. */
  it(`DB Manager: delete`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPre).to.be.equal(2);

    const oldDB = await dbManager.del({
      name: DB_FILE,
    });

    expect(oldDB.id).to.be.equal(2);

    // Check the admin database still exists.
    let numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);
    expect(numDBsPost).to.be.equal(numDBsPre - 1);

    // Check the current database is deleted.
    numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .countBy(Database, {
        name: DB_FILE,
      });
    expect(numDBsPost).to.be.equal(0);
  });

  it(`DB Manager: delete no id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const oldDB = await dbManager.del({
      path: DB_PATH,
    });

    expect(oldDB).to.be.equal(undefined);

    // Check the admin database still exists.
    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);
    expect(numDBsPost).to.be.equal(numDBsPre);
  });

  it(`DB Manager: delete admin id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const oldDB = await dbManager.del({
      id: 1,
    });

    expect(oldDB).to.be.equal(undefined);

    // Check the admin database still exists.
    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);
    expect(numDBsPost).to.be.equal(numDBsPre);
  });

  it(`DB Manager: delete admin name fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const oldDB = await dbManager.del({
      name: ADMIN_DB_FILE,
    });

    expect(oldDB).to.be.equal(undefined);

    // Check the admin database still exists.
    const numDBsPost = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);
    expect(numDBsPost).to.be.equal(numDBsPre);
  });
  /* #endregion */
});