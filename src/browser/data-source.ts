import 'reflect-metadata';
import initSqlJs from 'sql.js';

import { DataSource } from 'typeorm';
import { User } from '../entity/User';

export async function getAppDataSource(): Promise<DataSource> {
  const SQL = await initSqlJs({
    locateFile: _file => `sql-wasm.wasm`
  });

  return new DataSource({
    location: "stark-db",
    type: "sqljs",
    driver: SQL,
    synchronize: true, // TODO: remove this in production
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  });
}

