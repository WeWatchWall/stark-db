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

  protected async addInternal(arg: DBArg): Promise<[boolean, Database]> {
    if (arg.id != undefined || arg.name === DatabaseManagerBase.adminDB.name) {
      return [false, undefined];
    }

    // Check if the DB already exists.
    let DB = await DatabaseManagerBase
      .adminDB
      .DB
      .manager
      .findOneBy(Database, arg);
    
    if (DB != undefined) { return [false, DB]; }

    // Add the DB to the admin DB.
    DB = new Database(arg);
    await DatabaseManagerBase.adminDB.DB.manager.save(DB);

    return [true, DB];
  };

  abstract delete(arg: DBArg): Promise<Database>;

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