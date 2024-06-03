import { DataSource } from "typeorm";

export interface IDBConnection {
  connect(
    URL: string,
    entities: Function[],
    schemaSync: boolean
  ): Promise<DataSource>;
  disconnect(connection: DataSource): Promise<void>;
}