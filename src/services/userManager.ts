import { ObjectModel } from 'objectmodel';

import { User, UserData } from '../entity/user';
import { IAdminDB } from '../objects/IDB';
import { ADMIN_USER } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { IService } from './IService';

class UserManagerArg {
  DB: IAdminDB
}

export class UserManager implements IService {
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

  async add(arg: UserData): Promise<User> {
    if (arg.id != undefined || arg.userName === ADMIN_USER) {
      return undefined;
    }

    // Check if the user already exists.
    let user = await UserManager
      .adminDB
      .DB
      .manager
      .findOneBy(User, {
        id: arg.id,
        userName: arg.userName,
      });

    if (user != undefined) { return user; }

    // Add the user to the admin DB.
    user = new User(arg);
    await UserManager.adminDB.DB.manager.save(user);

    return user;
  }

  async delete(arg: UserData): Promise<User> {
    if (arg.id === 1 || arg.userName === ADMIN_USER) {
      return undefined;
    }

    // Check if the user already exists.
    let user = await UserManager
      .adminDB
      .DB
      .manager
      .findOneBy(User, {
        id: arg.id,
        userName: arg.userName,
      });
    
    if (user == undefined) { return user; }

    // Delete the user from the admin DB.
    await UserManager.adminDB.DB.manager.delete(User, user);

    return user;
  }

  async destroy(): Promise<void> {
    if (UserManager.adminDB == undefined) { return; }

    await UserManager.adminDB.destroy();
    delete UserManager.adminDB;
  }
}

const UserManagerInit = new ObjectModel({
});