import { DataSource } from "typeorm";

export interface IDBDriver {
  connect(
    database: string,
    entities: Function[],
    schemaSync: boolean
  ): Promise<DataSource>;

  disconnect(connection: DataSource): Promise<void>;

  provision(connection: DataSource): Promise<void>;

  createDB(name: string): Promise<void>;

  renameDB(
    oldName: string,
    newName: string,
  ): Promise<void>;
}