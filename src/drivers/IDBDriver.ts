import { DataSource } from "typeorm";

export interface IDBDriver {
  connect(
    URL: string,
    entities: Function[],
    schemaSync: boolean
  ): Promise<DataSource>;
  disconnect(connection: DataSource): Promise<void>;
}