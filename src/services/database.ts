import { Any, FunctionModel, ObjectModel } from 'objectmodel';

import { AdminDB as AdminDBBrowser } from '../browser/DBAdmin';
import { UserDB as UserDBBrowser } from '../browser/DBUser';
import { IAdminDB } from '../objects/IDB';
import { AdminDB as AdminDBServer } from '../server/DBAdmin';
import { UserDB as UserDBServer } from '../server/DBUser';
import { ADMIN_DB } from '../utils/constants';
import { CtorType } from '../utils/generics';
import { LazyValidator } from '../utils/lazyValidator';

/* #region  Constructor types for the generics. */
type adminDBTypes =
  CtorType<typeof AdminDBBrowser> |
  CtorType<typeof AdminDBServer>;

type userDBTypes =
  CtorType<typeof UserDBBrowser> |
  CtorType<typeof UserDBServer>;
/* #endregion */

/* #region  Argument type for the type below. */
export class DBManagerArg<
  T extends adminDBTypes,
  U extends userDBTypes
> {
  adminType: T;
  userType: U;
  path?: string;
}
/* #endregion */

export class DatabaseManager<
  T extends adminDBTypes,
  U extends userDBTypes
> {
  static adminDB: IAdminDB;

  /**
   * Inits a database manager.
   * @template T The type of AdminDB. Options: browser or server.
   * @param [init] The 
   * @returns init 
   */
  static async init<
    T extends adminDBTypes,
    U extends userDBTypes
  >(init: DBManagerArg<T, U>): Promise<DatabaseManager<T, U>> {
    const result = new DatabaseManager<T, U>(init);

    await result.ready();

    return result;
  }

  path: string;
  validator: LazyValidator;

  private adminDBType: T;
  protected userDBType: U; // TODO: make private;

  constructor(init?: DBManagerArg<T, U>) {
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
    // TODO
  }

  async delete(): Promise<void> {
    // TODO
  }

  async destroy(): Promise<void> {
    if (DatabaseManager.adminDB === undefined) { return; }

    await DatabaseManager.adminDB.destroy();
    delete DatabaseManager.adminDB;
  }
}

const DBManagerInit = new ObjectModel({
  adminType: [
    FunctionModel(Any).return(AdminDBBrowser),
    FunctionModel(Any).return(AdminDBServer)
  ],
  userType: [
    FunctionModel(Any).return(UserDBBrowser),
    FunctionModel(Any).return(UserDBServer)
  ],
  path: [String],
}).defaultTo({
  path: './',
});