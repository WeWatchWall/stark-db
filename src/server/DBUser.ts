import { IUserDB } from '../objects/IDB';
import { DBUtils } from '../utils/DB';
import { LazyValidator } from '../utils/lazyValidator';
import { PersistentDB, PersistentDBArg } from './DBPersistent';

export class UserDB extends PersistentDB implements IUserDB {
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
      this.validator.valid();
    }
  }

  protected async ready(): Promise<void> {
    await super.ready();
    await DBUtils.readyUserDB(this.db);
  }
}