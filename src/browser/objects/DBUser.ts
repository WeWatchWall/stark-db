import { StarkTable } from '../../entity/table';
import { StarkVariable } from '../../entity/variable';
import { PersistentDBBase } from '../../objects/DBPersistent';
import { IUserDB } from '../../objects/IDB';
import { LazyValidator } from '../../utils/lazyValidator';
import { PersistentDB, PersistentDBArg } from './DBPersistent';

export class UserDB extends PersistentDB implements IUserDB {
  validator: LazyValidator;

  constructor(init: PersistentDBArg) {
    super(init);

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.entities = [StarkTable, StarkVariable];
      this.validator.valid();
    }
  }

  protected async ready(): Promise<void> {
    await super.ready();
    await PersistentDBBase.readyUserDB(this.DB);
  }
}