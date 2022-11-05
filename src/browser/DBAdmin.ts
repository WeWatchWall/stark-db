import { User } from "../entity/user";
import { LazyValidator } from "../shared/utils/lazyValidator";
import { PersistentDB, PersistentDBArg } from "./DBPersistent";

export class AdminDB extends PersistentDB {
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
      this.entities = [User];
      this.validator.valid();
    }
  }

  protected async ready(): Promise<void> {
    await super.ready();

    // Check if the database is already initialized.
  }
}