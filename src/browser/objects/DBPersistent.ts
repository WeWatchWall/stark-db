import localforage from 'localforage';
import { Any, ArrayModel, BasicModel, ObjectModel } from 'objectmodel';
import initSqlJs from 'sql.js';
import { DataSource } from 'typeorm';
import { SqljsEntityManager } from 'typeorm/entity-manager/SqljsEntityManager';

import {
  PersistentDBArgBase,
  PersistentDBBase
} from '../../objects/DBPersistent';

const MIN_INTERVAL = 0.5e3;
const DEFAULT_INTERVAL = 10e3;

export class PersistentDBArg extends PersistentDBArgBase {
  saveInterval?: number;
}

export abstract class PersistentDB extends PersistentDBBase {
  saveInterval: number;

  private interval: ReturnType<typeof setInterval>;
  private static driver: any;

  protected validate(): void {
    new PersistentDBInit(this);

    // Set the defaults.
    this.entities = this.entities || [];
    this.path = this.path || './';
    this.fileName = `${this.path}/${this.name}`;

    this.saveInterval = this.saveInterval || DEFAULT_INTERVAL;
  }

  protected async ready(): Promise<void> {
    // Lazy initialization of the driver.
    if (PersistentDB.driver == undefined) {
      PersistentDB.driver = await initSqlJs({
        locateFile: (_path: string) => `sql-wasm.wasm`
      });
    }

    // Open the database.
    await this.load();

    // Start the save interval.
    this.interval = setInterval(async () => {
      await this.save();
    }, this.saveInterval);    
  }

  async load(): Promise<void> {
    const database: Uint8Array = await localforage.getItem(this.fileName);

    this.DB = new DataSource({
      database,
      type: "sqljs",
      driver: PersistentDB.driver,
      synchronize: true, // TODO: remove this in production
      logging: false,
      entities: this.entities,
    });

    await this.DB.initialize();
  }

  async save(): Promise<void> {
    const dbData = (<SqljsEntityManager>this.DB.manager).exportDatabase();
    await localforage.setItem(this.fileName, dbData);
  }

  async destroy(): Promise<void> {
    clearInterval(this.interval);
    delete this.interval;

    await this.save();
    await this.DB.destroy();
    delete this.DB;
  }
}

/* #region  Use schema to check the properties. */
const Integer = BasicModel(Number)
  .assert(Number.isSafeInteger)
  .as("Integer");
const PositiveInteger = Integer
  .assert(function isPositive(n) { return n >= MIN_INTERVAL })
  .as("PositiveInteger");
const PersistentDBInit = new ObjectModel({
  name: String,
  path: [String],

  entities: [ArrayModel(Any)],
  saveInterval: [PositiveInteger],
});
/* #endregion */