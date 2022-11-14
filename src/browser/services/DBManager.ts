import localforage from 'localforage';

import { Database, DBArg } from '../../entity/DB';
import { DatabaseManagerBase, DBManagerArg } from '../../services/DBManager';
import { ADMIN_DB } from '../../utils/constants';
import { AdminDB } from '../objects/DBAdmin';
import { UserDB } from '../objects/DBUser';

export class DatabaseManager extends DatabaseManagerBase {

  /**
   * Inits a database manager.
   * @param [init] @type {DBManagerArg} The argument object. 
   * @returns init @type {Promise<DatabaseManager>} The database manager.
   */
  static async init(init: DBManagerArg): Promise<DatabaseManager> {
    const result = new DatabaseManager(init);

    await result.ready();

    return result;
  }

  protected async ready() {
    if (DatabaseManagerBase.adminDB != undefined) { return; }

    DatabaseManagerBase.adminDB = new AdminDB({
      name: ADMIN_DB,
      path: this.path,
    });

    await DatabaseManagerBase.adminDB.validator.readyAsync();
  }

  async add(arg: DBArg): Promise<Database> {
    // Add the DB to the admin DB.
    arg.path = arg.path || this.path;
    const DB = await super.addInternal(arg);
    if (DB == undefined) { return DB; }

    // Create the new DB.
    const userDB = new UserDB({
      name: DB.name,
      path: DB.path,
    });
    await userDB.validator.readyAsync();
    DB.userDB = userDB;

    return DB;
  }

  async set(arg: DBArg): Promise<Database> {
    const oldDB = await super.getInternal({ id: arg.id });
    if (oldDB == undefined) { return oldDB; }

    // Check if this is a NOOP.
    if (
      (arg.name === oldDB.name && arg.path === oldDB.path) ||
      (arg.name === oldDB.name && arg.path == undefined) ||
      (arg.name == undefined && arg.path === oldDB.path)
    ) {
      return this.get(arg);
    }

    // Set the new DB info in the admin DB.
    const DB = await super.setInternal(arg);
    if (DB == undefined) { return DB; }

    const oldPath = `${oldDB.path}/${oldDB.name}`;
    const newPath = `${DB.path}/${DB.name}`;

    // Replace the old key with the new key.
    const oldFile = await localforage.getItem(oldPath);
    await localforage.setItem(newPath, oldFile);
    await localforage.removeItem(oldPath);

    // Create the new DB.
    const userDB = new UserDB({
      name: DB.name,
      path: DB.path,
    });
    await userDB.validator.readyAsync();
    DB.userDB = userDB;

    return DB;
  }

  async get(arg: DBArg): Promise<Database> {
    // Get the info from the Admin DB.
    const DB = await super.getInternal(arg);
    if (DB == undefined) { return DB; }

    // Create the new DB.
    const userDB = new UserDB({
      name: DB.name,
      path: DB.path,
    });
    await userDB.validator.readyAsync();
    DB.userDB = userDB;

    return DB;
  }

  async del(arg: DBArg): Promise<Database> {
    // Delete the info from the Admin DB.
    const DB = await super.deleteInternal(arg);
    if (DB == undefined) { return DB; }

    const filePath = `${arg.path}/${arg.name}`;
    await localforage.removeItem(filePath);

    return DB;
  }
}