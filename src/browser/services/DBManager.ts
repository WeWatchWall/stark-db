import localforage from 'localforage';

import { DBData } from '../../entity/DB';
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

  async add(arg: DBData): Promise<void> {
    // Add the defaults.
    const newDB = Object.assign({
      path: this.path,
    }, arg);

    if (!await super.addInternal(newDB)) { return; }

    // Create the new DB file.
    const userDB = new UserDB({
      name: newDB.name,
      path: newDB.path,
      entities: [StarkVariable],
    });
    await userDB.validator.readyAsync();
    await userDB.destroy();
  }

  async delete(arg: DBData): Promise<void> {
    const DB = await super.deleteInternal(arg);

    if (DB == undefined) { return; }

    const filePath = `${arg.path}/${arg.name}`;
    await localforage.removeItem(filePath);
  }
}