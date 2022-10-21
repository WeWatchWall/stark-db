import 'reflect-metadata';

import { DataSource } from 'typeorm';
import { User } from '../entity/User';
import sqlite3 from 'sqlite3';

export async function getAppDataSource(): Promise<DataSource> {
  let dataSource: DataSource;
  // dataSource = new DataSource({
  //   type: "sqlite",
  //   database: "./test.db",
  //   cache: true,
  //   synchronize: true, // TODO: remove this in production
  //   logging: false,
  //   entities: [User],
  //   migrations: [],
  //   subscribers: [],
  // });
  dataSource = new DataSource({
    type: "sqlite",
    database: "file:./test/tmp/test_memory.db?mode=memory",
    flags: sqlite3.OPEN_URI | sqlite3.OPEN_SHAREDCACHE | sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    cache: true,
    synchronize: true, // TODO: remove this in production
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  });

  return dataSource;
}
