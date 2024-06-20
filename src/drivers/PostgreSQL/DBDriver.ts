import { DataSource } from "typeorm";
import { POSTGRES_DRIVER } from "../../utils/constants";
import { IDBDriver } from "../IDBDriver";

export class DDriver implements IDBDriver {
  async connect(
    URL: string,
    entities: Function[] = [],
    schemaSync: boolean = false
  ): Promise<DataSource> {
    return new DataSource({
      type: POSTGRES_DRIVER,
      database: URL,
      cache: false,
      synchronize: schemaSync,
      logging: false,
      entities: entities,
      migrations: [],
      subscribers: [],
    });
  }

  async disconnect(connection: DataSource): Promise<void> {
    await connection.destroy();
  }
}