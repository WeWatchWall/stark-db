import { DataSource } from "typeorm";
import { POSTGRES_DRIVER } from "../../utils/constants";
import { IDBDriver } from "../IDBDriver";

export class DBDriver implements IDBDriver {
  async connect(
    database: string,
    entities: Function[] = [],
    schemaSync: boolean = false,

    host: string = "localhost",
    port: number = 5432,
    username: string = "postgres",
    password: string = "postgres"
  ): Promise<DataSource> {
    const connection = new DataSource({
      type: POSTGRES_DRIVER,
      
      database,
      host,
      port,

      username,
      password,

      cache: false,
      synchronize: schemaSync,
      logging: false,
      entities: entities,
      migrations: [],
      subscribers: [],
    });

    await connection.initialize();

    return connection;
  }

  async disconnect(connection: DataSource): Promise<void> {
    await connection.destroy();
  }

  async provision(_connection: DataSource): Promise<void> {
  }

  async createDB(name: string, connection: DataSource = null): Promise<void> {
    if (connection == null) { return; }

    try {
      await connection.query(`CREATE DATABASE ${name};`);
    } catch (_error) {
      // ignore the error if the database already exists.
    }
  }

  async renameDB(
    oldName: string,
    newName: string,

    connection: DataSource = null
  ): Promise<void> {
    if (connection == null) { return; }

    await connection.query(`ALTER DATABASE ${oldName} RENAME TO ${newName};`);
  }

  async deleteDB(name: string, connection: DataSource = null): Promise<void> {
    if (connection == null) { return; }

    await connection.query(`DROP DATABASE ${name};`);
  }
}