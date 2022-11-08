import { ObjectModel } from 'objectmodel';

import { AdminDB as AdminDBBrowser } from '../browser/objects/DBAdmin';
import { UserDB as UserDBBrowser } from '../browser/objects/DBUser';
import { DBManager as DBManagerBrowser } from '../browser/utils/DBManager';
import { DBManager as DBManagerServer } from '../server/utils/DBManager';
import { Database, DBData } from '../entity/DB';
import { IAdminDB } from '../objects/IDB';
import { AdminDB as AdminDBServer } from '../server/objects/DBAdmin';
import { UserDB as UserDBServer } from '../server/objects/DBUser';
import { ADMIN_DB } from '../utils/constants';
import { CtorType } from '../utils/generics';
import { LazyValidator } from '../utils/lazyValidator';

/* #region  Browser and server types. */
type typeID = 'browser' | 'server';

type adminDBTypes =
  CtorType<typeof AdminDBBrowser> |
  CtorType<typeof AdminDBServer>;

type userDBTypes =
  CtorType<typeof UserDBBrowser> |
  CtorType<typeof UserDBServer>;
/* #endregion */

/* #region  Argument type for the type below. */
class DBManagerArg {
  typeID: typeID;
  path?: string;
}
/* #endregion */

export class DatabaseManager {
  static adminDB: IAdminDB;

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

  typeID: typeID;
  path: string;
  validator: LazyValidator;

  private adminDBType: adminDBTypes;
  protected userDBType: userDBTypes; // TODO: make private;

  constructor(init?: DBManagerArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init !== undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }

  protected validate(): void {
    new DBManagerInit(this);

    // Set the defaults.
    this.path = this.path || './';

    // Avoids ambiguous validation.
    switch (this.typeID) {
      case 'browser':
        this.adminDBType = AdminDBBrowser;
        this.userDBType = UserDBBrowser;
        break;
      case 'server':
        this.adminDBType = AdminDBServer;
        this.userDBType = UserDBServer;
        break;
      default:
        throw new Error(`Critical error: should not happen due to validation.`);
    }
  }

  protected async ready() {
    if (DatabaseManager.adminDB !== undefined) { return; }

    DatabaseManager.adminDB = new this.adminDBType({
      name: ADMIN_DB,
      path: this.path,
    });

    await DatabaseManager.adminDB.validator.readyAsync();
  }

  async add(): Promise<void> {
    // TODO: arg: IDBArg
  }

  async delete(arg: DBData): Promise<void> {
    // Get the DB to delete.
    const DB = await DatabaseManager
      .adminDB
      .db
      .manager
      .findOne(Database, <any>arg); // TODO: remove cast.
    
    // Check if the DB exists.
    if (DB === undefined) { return; }

    // Delete the DB from the admin DB.
    await DatabaseManager.adminDB.db.manager.delete(Database, arg);

    // TODO: destroy the memory DB and any active
    //   connections to the persistent DB.

    // Delete the DB from the file system.
    switch (this.typeID) {
      case 'browser':
        DBManagerBrowser.delete(DB);
        break;
      case 'server':
        DBManagerServer.delete(DB);
        break;
      default:
        throw new Error(`Critical error: should not happen due to validation.`);
    }
  }

  async destroy(): Promise<void> {
    if (DatabaseManager.adminDB === undefined) { return; }

    await DatabaseManager.adminDB.destroy();
    delete DatabaseManager.adminDB;
  }
}

const DBManagerInit = new ObjectModel({
  typeID: ['browser', 'server'],
  path: [String],
});