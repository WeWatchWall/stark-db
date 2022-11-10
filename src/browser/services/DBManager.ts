import localforage from 'localforage';

import { Database, DBData } from '../../entity/DB';
import { StarkVariable } from '../../entity/variable';
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

  async add(arg: DBData): Promise<Database> {
    // Add the defaults.
    const newDB = Object.assign({
      path: this.path,
    }, arg);

    const [isNew, DB] = await super.addInternal(newDB);
    if (!isNew) { return DB; }

    // Create the new DB file.
    const userDB = new UserDB({
      name: newDB.name,
      path: newDB.path,
      entities: [StarkVariable],
    });
    await userDB.validator.readyAsync();
    await userDB.destroy();

    return DB;
  }

  async delete(arg: DBData): Promise<Database> {
    // Add the defaults.
    const oldDB = Object.assign({
      path: this.path,
    }, arg);
    const DB = await super.deleteInternal(oldDB);

    if (DB == undefined) { return DB; }

    const filePath = `${arg.path}/${arg.name}`;
    await localforage.removeItem(filePath);

    return DB;
  }
}