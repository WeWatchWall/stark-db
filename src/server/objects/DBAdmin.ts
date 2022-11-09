import { Database } from '../../entity/DB';
import { User } from '../../entity/user';
import { PersistentDBBase } from '../../objects/DBPersistent';
import { IAdminDB } from '../../objects/IDB';
import { LazyValidator } from '../../utils/lazyValidator';
import { PersistentDB, PersistentDBArg } from './DBPersistent';

export class AdminDB extends PersistentDB implements IAdminDB {
  validator: LazyValidator;
  userName: string;

  constructor(init: PersistentDBArg) {
    super(init);

    // Copy the properties.
    if (init !== undefined) {
      Object.assign(this, init);
      this.entities = [Database, User];
      this.validator.valid();
    }
  }

  protected async ready(): Promise<void> {
    await super.ready();
    await PersistentDBBase.readyAdminDB(this.db, this.name, this.path);
  }
}