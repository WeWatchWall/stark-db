import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import path from 'path';
import { DataSource } from 'typeorm';

import {
  PersistentDBArgBase,
  PersistentDBBase
} from '../../objects/DBPersistent';

export class PersistentDBArg extends PersistentDBArgBase {}

export abstract class PersistentDB extends PersistentDBBase {

  protected validate(): void {
    new PersistentDBInit(this);

    // Set the defaults.
    this.entities = this.entities || [];
    this.path = this.path || './';
    this.fileName = path.resolve(this.path, this.name);
  }

  protected async ready(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    // Open the database.
    this.DB = new DataSource({
      type: "sqlite",
      database: this.fileName,
      cache: true,
      synchronize: true, // TODO: remove this in production
      logging: false,
      entities: this.entities,
    });

    await this.DB.initialize();
  }

  async save(): Promise<void> {
    // NOOP
  }

  async destroy(): Promise<void> {
    await this.DB.destroy();
    delete this.DB;
  }
}

/* #region  Use schema to check the properties. */
const PersistentDBInit = new ObjectModel({
  name: String,
  path: [String],

  entities: [ArrayModel(Any)],
});
/* #endregion */