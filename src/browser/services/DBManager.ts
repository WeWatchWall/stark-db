import localforage from 'localforage';

import { DBData } from '../../entity/DB';
import { DatabaseManagerBase, DBManagerArg } from '../../services/DBManager';
import { ADMIN_DB } from '../../utils/constants';
import { AdminDB } from '../objects/DBAdmin';

export class DatabaseManager extends DatabaseManagerBase {

  /**
   * Inits a database manager.
   * @template T The type of AdminDB. Options: browser or server.
   * @param [init] The 
   * @returns init 
   */
  static async init(init: DBManagerArg): Promise<DatabaseManager> {
    const result = new DatabaseManager(init);

    await result.ready();

    return result;
  }

  protected async ready() {
    if (DatabaseManager.adminDB !== undefined) { return; }

    DatabaseManager.adminDB = new AdminDB({
      name: ADMIN_DB,
      path: this.path,
    });

    await DatabaseManager.adminDB.validator.readyAsync();
  }

  async add(): Promise<void> {
    // TODO: arg: IDBArg
  }

  async delete(arg: DBData): Promise<void> {
    const DB = super.deleteInternal(arg);

    if (DB === undefined) { return; }

    const filePath = `${arg.path}/${arg.name}`;
    await localforage.removeItem(filePath);
  }
}