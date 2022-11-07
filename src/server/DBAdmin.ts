import { Database } from '../entity/DB';
import { User } from '../entity/user';
import { IAdminDB } from '../objects/IDB';
import { DBUtils } from '../utils/DB';
import { LazyValidator } from '../utils/lazyValidator';
import { PersistentDB, PersistentDBArg } from './DBPersistent';

export class AdminDB extends PersistentDB implements IAdminDB {
  validator: LazyValidator;

  constructor(init: PersistentDBArg) {
    super();

    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init !== undefined) {
      Object.assign(this, init);
      this.entities = [Database, User];
      this.validator.valid();
    }
  }

  protected async ready(): Promise<void> {
    await super.ready();
    await DBUtils.readyAdminDB(this.db);
  }
}