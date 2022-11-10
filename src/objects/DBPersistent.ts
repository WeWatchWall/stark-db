import { DataSource } from 'typeorm';

import { Database } from '../entity/DB';
import { User } from '../entity/user';
import { StarkVariable } from '../entity/variable';
import { ADMIN_DB, ADMIN_USER, DB_IDENTIFIER } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { IDB, IDBArg } from './IDB';

export abstract class PersistentDBArgBase implements IDBArg {
  name: string;
  path?: string;

  entities?: any[];
}

export abstract class PersistentDBBase implements IDB {
  validator: LazyValidator;

  name: string;
  path: string;
  fileName: string;

  entities: any[];
  DB: DataSource;

  constructor(_init: IDBArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );
  }

  abstract load(): Promise<void>;
  abstract save(): Promise<void>;
  abstract destroy(): Promise<void>;

  protected abstract validate(): void;
  protected abstract ready(): Promise<void>;

  protected static async readyAdminDB(
    db: DataSource,
    name?: string,
    path?: string,
  ): Promise<void> {
    // Skip if the DB is already initialized.
    if (await PersistentDBBase.isInitCheck(db)) { return; }

    // Create the admin user.
    const user = new User({
      userName: ADMIN_USER,
      password: '',
      salt: ''
    });
    await db.manager.save(user);

    // Create the admin database.
    const database = new Database({
      name: name || ADMIN_DB,
      path: path || '',
    });
    await db.manager.save(database);

    // Set the DB user_version flag as initialized.
    await PersistentDBBase.isInitSet(db);
  }

  protected static async readyUserDB(db: DataSource): Promise<void> {
    // Skip if the DB is already initialized.
    if (await PersistentDBBase.isInitCheck(db)) { return; }

    /* #region  Add helper variables. */
    const tablesVar = new StarkVariable({
      name: 'tables',
      value: JSON.stringify([])
    });

    const isWALVar = new StarkVariable({
      name: 'isWAL',
      value: false
    });

    const memoryOnlyVar = new StarkVariable({
      name: 'memoryOnly',
      value: JSON.stringify([])
    });

    const isMemoryOnlyVar = new StarkVariable({
      name: 'isMemoryOnly',
      value: false
    });

    const memoryPersistVar = new StarkVariable({
      name: 'memoryPersist',
      value: JSON.stringify([])
    });

    const isMemoryPersistVar = new StarkVariable({
      name: 'isMemoryPersist',
      value: false
    });

    const lastAccessVar = new StarkVariable({
      name: 'lastAccess',
      value: Date.now()
    });

    await db.manager.save(tablesVar);
    await db.manager.save(isWALVar);
    await db.manager.save(memoryOnlyVar);
    await db.manager.save(isMemoryOnlyVar);
    await db.manager.save(memoryPersistVar);
    await db.manager.save(isMemoryPersistVar);
    await db.manager.save(lastAccessVar);
    /* #endregion */

    // Set the DB user_version flag as initialized.
    await PersistentDBBase.isInitSet(db);
  }

  /**
   * Check if the database is already initialized.
   * @param db @type {DataSource} The database. 
   * @returns isInit @type {boolean} True if the database is initialized.
   */
   private static async isInitCheck(db: DataSource): Promise<boolean> {
    const result = await db.query(`PRAGMA user_version;`);

    return result[0][`user_version`] === DB_IDENTIFIER;
  }

  /**
   * Set the database user_version ID.
   * @param db @type {DataSource} The database. 
   * @returns @type {void}
   */
  private static async isInitSet(db: DataSource): Promise<void> {
    // This query doesn't work with parameters.
    await db.query(`PRAGMA user_version = ${DB_IDENTIFIER};`);
  }
}