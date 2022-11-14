import { ObjectModel } from 'objectmodel';

import { Database, DBArg } from '../entity/DB';
import { IAdminDB } from '../objects/IDB';
import { LazyValidator } from '../utils/lazyValidator';
import { IService, IServiceArg } from './IService';

export class DBManagerArg implements IServiceArg {
  path?: string;
}

export abstract class DatabaseManagerBase implements IService {
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

  abstract add(arg: DBArg): Promise<Database>;

  protected async addInternal(arg: DBArg): Promise<Database> {
    if (arg.id != undefined || arg.name === DatabaseManagerBase.adminDB.name) {
      return undefined;
    }

    // Add the DB to the admin DB.
    const DB = new Database(arg);
    await DatabaseManagerBase.adminDB.DB.manager.save(DB);

    return DB;
  };

  abstract set(arg: DBArg): Promise<Database>;

  protected async setInternal(arg: DBArg): Promise<Database> {
    if (arg.id == undefined || arg.name === DatabaseManagerBase.adminDB.name) {
      return undefined;
    }

    // Get the DB to update.
    const DB = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .findOneBy(Database, { id: arg.id });
    
    // Check if the DB exists.
    if (DB == undefined) { return DB; }

    Object.assign(DB, arg);

    // Update the DB in the admin DB.
    await DatabaseManagerBase.adminDB.DB.manager.save(Database, DB);

    return DB;
  }

  abstract get(arg: DBArg): Promise<Database>;

  protected async getInternal(arg: DBArg): Promise<Database> {
    if (arg.id == undefined && arg.name == undefined) { return undefined; }

    return await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .findOneBy(Database, arg);
  }

  abstract del(arg: DBArg): Promise<Database>;

  protected async deleteInternal(arg: DBArg): Promise<Database> {
    if (
      (arg.id == undefined && arg.name == undefined) ||
      arg.id == 1 ||
      arg.name === DatabaseManagerBase.adminDB.name
    ) {
      return undefined;
    }

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