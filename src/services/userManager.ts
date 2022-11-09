import { ObjectModel } from 'objectmodel';
import { DataSource } from 'typeorm';

import { IAdminDB } from '../objects/IDB';
import { LazyValidator } from '../utils/lazyValidator';

class UserManagerArg {
  adminDB: IAdminDB
}

export class UserManager {
  static adminDBsource: DataSource;

  /**
   * Inits a database manager.
   * @template T The type of AdminDB. Options: browser or server.
   * @param [init] The 
   * @returns init 
   */
  static async init(init: UserManagerArg): Promise<UserManager> {
    const result = new UserManager(init);

    await result.ready();

    return result;
  }

  adminDB: IAdminDB;
  validator: LazyValidator;

  constructor(init?: UserManagerArg) {
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
    new UserManagerInit(this);
  }

  protected async ready() {
    if (UserManager.adminDBsource !== undefined) { return; }

    await this.adminDB.validator.readyAsync();
    UserManager.adminDBsource = this.adminDB.db;
  }

  async add(): Promise<void> {
    // TODO
  }

  async delete(): Promise<void> {
    // TODO
  }

  async destroy(): Promise<void> {
    if (UserManager.adminDBsource === undefined) { return; }

    UserManager.adminDBsource.destroy();
    delete UserManager.adminDBsource;
  }
}

const UserManagerInit = new ObjectModel({
});