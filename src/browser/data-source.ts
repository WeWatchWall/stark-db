import 'reflect-metadata';
import initSqlJs from 'sql.js';

import { DataSource } from 'typeorm';
import { User } from '../entity/User';

export async function getAppDataSource(): Promise<DataSource> {
  const SQL = await initSqlJs({
    locateFile: _file => `sql-wasm.wasm`
  });

  return new DataSource({
    type: "sqljs",
    driver: SQL,
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  });
}

