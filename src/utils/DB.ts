import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';

import { DB_DRIVER, Target } from './constants';

export function getDBConnection(
  name: string,
  target: Target,
  entities: any[] = []
): DataSource {
  switch (target) {
    case Target.DB:
      return new DataSource({
        type: DB_DRIVER,
        database: name,
        cache: true,
        synchronize: true, // TODO: should this be disabled?
        logging: false,
        entities: entities,
        migrations: [],
        subscribers: [],
      });
    case Target.mem:
      return new DataSource({
        type: DB_DRIVER,
        database: `file:${name}?mode=memory`,
        flags:
          sqlite3.OPEN_URI |
          sqlite3.OPEN_SHAREDCACHE |
          sqlite3.OPEN_READWRITE |
          sqlite3.OPEN_CREATE,
        cache: true,
        synchronize: true, // TODO: should this be disabled?
        logging: false,
        entities: entities,
        migrations: [],
        subscribers: [],
      });
    default:
      throw new Error(`Invalid target: ${target}`);
  }
};