import { DataSource } from 'typeorm';

import { Database } from '../entity/DB';
import { User } from '../entity/user';
import { Variable } from '../entity/variable';
import { ADMIN_DB, ADMIN_USER, DB_IDENTIFIER, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Variables } from '../utils/variables';
import { IDB, IDBArg } from './IDB';

const PRAGMA = 'user_version';

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

    /* #region  Set up the variables. */
    const isChanged = new Variable({
      name: Variables.isChanged,
      value: false
    });

    const isWALVar = new Variable({
      name: Variables.isWAL,
      value: true
    });

    const isMemoryVar = new Variable({
      name: Variables.isMemory,
      value: true
    });

    const numChangesVar = new Variable({
      name: Variables.numChanges,
      value: ZERO
    });

    const lastAccessVar = new Variable({
      name: Variables.lastAccess,
      value: Date.now()
    });

    await db.manager.save(isChanged);
    await db.manager.save(isWALVar);
    await db.manager.save(isMemoryVar);
    await db.manager.save(numChangesVar);
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
    const result = await db.query(`PRAGMA ${PRAGMA};`);

    return result[0][PRAGMA] === DB_IDENTIFIER;
  }

  /**
   * Set the database user_version ID.
   * @param db @type {DataSource} The database. 
   * @returns @type {void}
   */
  private static async isInitSet(db: DataSource): Promise<void> {
    // This query doesn't work with parameters.
    await db.query(`PRAGMA ${PRAGMA} = ${DB_IDENTIFIER};`);
  }
}