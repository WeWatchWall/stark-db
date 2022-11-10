import { ObjectModel } from 'objectmodel';

import { Database, DBData } from '../entity/DB';
import { IAdminDB } from '../objects/IDB';
import { LazyValidator } from '../utils/lazyValidator';

export class DBManagerArg {
  path?: string;
}

export abstract class DatabaseManagerBase {
  static adminDB: IAdminDB;

  path: string;
  validator: LazyValidator;

  constructor(init?: DBManagerArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }

  protected validate(): void {
    new DBManagerInit(this);

    // Set the defaults.
    this.path = this.path || './';
  }

  protected abstract ready(): Promise<void>;

  abstract add(arg: DBData): Promise<void>;

  protected async addInternal(arg: DBData): Promise<boolean> {
    // Check if the DB already exists.
    let DB = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .findOneBy(Database, arg);
    
    if (DB != undefined) { return false; }

    // Add the DB to the admin DB.
    DB = new Database(arg);
    await DatabaseManagerBase.adminDB.DB.manager.save(DB);

    return true;
  };

  abstract delete(arg: DBData): Promise<void>;

  protected async deleteInternal(arg: DBData): Promise<Database> {
    // Get the DB to delete.
    const DB = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .findOneBy(Database, arg);
    
    // Check if the DB exists.
    if (DB == undefined) { return DB; }

    // Delete the DB from the admin DB.
    await DatabaseManagerBase.adminDB.DB.manager.delete(Database, arg);

    return DB;
  }

  async destroy(): Promise<void> {
    if (DatabaseManagerBase.adminDB == undefined) { return; }

    await DatabaseManagerBase.adminDB.destroy();
    delete DatabaseManagerBase.adminDB;
  }
}

const DBManagerInit = new ObjectModel({
  path: [String],
});