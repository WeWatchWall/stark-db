import { ObjectModel } from 'objectmodel';
import { DataSource } from 'typeorm';

import { IAdminDB } from '../objects/IDB';
import { LazyValidator } from '../utils/lazyValidator';

class UserManagerArg {
  DB: IAdminDB
}

export class UserManager {
  static adminDB: IAdminDB;

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

  validator: LazyValidator;
  private DB: IAdminDB;

  constructor(init?: UserManagerArg) {
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
    new UserManagerInit(this);
  }

  protected async ready() {
    if (UserManager.adminDB != undefined) { return; }

    await this.DB.validator.readyAsync();
    UserManager.adminDB = this.DB;
  }

  async add(): Promise<void> {
    // TODO
  }

  async delete(): Promise<void> {
    // TODO
  }

  async destroy(): Promise<void> {
    if (UserManager.adminDB == undefined) { return; }

    await UserManager.adminDB.destroy();
    delete UserManager.adminDB;
  }
}

const UserManagerInit = new ObjectModel({
});