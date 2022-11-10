import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { Database } from '../../src/entity/DB';
import { DatabaseManager } from '../../src/server/services/DBManager';
import { DatabaseManagerBase } from '../../src/services/DBManager';

const DB_PATH = `./test`;
const ADMIN_DB_FILE = `stark-admin.db`;
const DB_FILE = `test.db`;

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
  });

  it(`DB Manager: init`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    await dbManager.validator.readyAsync();

    expect(!!DatabaseManagerBase.adminDB).to.be.equal(true);
  });

  it(`DB Manager: destroy`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    await dbManager.validator.readyAsync();
    await dbManager.destroy();

    expect(!DatabaseManagerBase.adminDB).to.be.equal(true);
  });

  /* #region  Add tests. */
  it(`DB Manager: add`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

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

  it(`DB Manager: add admin fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

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

  it(`DB Manager: add admin id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

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
  /* #endregion */

  
  /* #region  Delete tests. */
  it(`DB Manager: delete no id fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPre).to.be.equal(2);

    const oldDB = await dbManager.delete({
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

  /* #region  Delete tests. */
  it(`DB Manager: delete`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    expect(numDBsPre).to.be.equal(2);

    const oldDB = await dbManager.delete({
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

  it(`DB Manager: delete admin fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const oldDB = await dbManager.delete({
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

  it(`DB Manager: delete admin fail`, async () => {
    const dbManager = await DatabaseManager.init({
      path: DB_PATH,
    });

    // Optional because it is already called and is idemnpotent.
    await dbManager.validator.readyAsync();

    const numDBsPre = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .count(Database);

    const oldDB = await dbManager.delete({
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
  /* #endregion */
});