import 'reflect-metadata';

import { DataSource } from 'typeorm';
import { User } from '../entity/User';

export async function getAppDataSource(): Promise<DataSource> {
  return new DataSource({
    type: "sqlite",
    database: "./test.db",
    cache: true,
    synchronize: true, // TODO: remove this in production
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  });
}
