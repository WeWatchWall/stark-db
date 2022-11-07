import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import path from 'path';
import { DataSource } from 'typeorm';

import { IDB } from '../objects/IDB';
import { LazyValidator } from '../utils/lazyValidator';

export class PersistentDBArg {
  name: string;
  path: string;
  entities?: any[];
}

export abstract class PersistentDB implements IDB {
  validator: LazyValidator;

  name: string;
  path: string;
  fileName: string;
  entities?: any[];
  db: DataSource;

  protected validate(): void {
    new PersistentDBInit(this);

    this.entities = this.entities || [];
  }

  protected async ready(): Promise<void> {
    this.fileName = path.resolve(this.path, this.name);

    await this.load();
  }

  async load(): Promise<void> {
    // Open the database.
    this.db = new DataSource({
      type: "sqlite",
      database: this.fileName,
      cache: true,
      synchronize: true, // TODO: remove this in production
      logging: false,
      entities: this.entities,
    });

    await this.db.initialize();
  }

  async save(): Promise<void> {
    // NOOP
  }

  async destroy(): Promise<void> {
    await this.db.destroy();
  }
}

/* #region  Use schema to check the properties. */
const PersistentDBInit = new ObjectModel({
  name: String,
  path: String,
  entities: ArrayModel(Any),
}).defaultTo({
  path: '',
  entities: [],
});
/* #endregion */