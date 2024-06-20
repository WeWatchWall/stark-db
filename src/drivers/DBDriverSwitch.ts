import { DataSource } from "typeorm";
import * as args from "../utils/args";
import { IDBDriver } from "./IDBDriver";
import { DBDriver as PostgresDriver } from "./PostgreSQL/DBDriver";
import { DBDriver as SQLiteDriver } from "./SQLite/DBDriver";

export class DBDriverSwitch {
  static DBDriver: IDBDriver;
  static postgresConnection: DataSource;
  
  static async init() {
    if (DBDriverSwitch.DBDriver != undefined) { return; }

    switch (args.engine) {
      case "sqlite":
        DBDriverSwitch.DBDriver = new SQLiteDriver();
        break;
      case "postgres":
        DBDriverSwitch.DBDriver = new PostgresDriver();
        DBDriverSwitch.postgresConnection =
          await DBDriverSwitch.connect("postgres", [], false);
        break;
      default:
        throw new Error("Unknown engine: " + args.engine);
    }
  }

  static async connect(
    database: string,
    entities: Function[],
    schemaSync: boolean
  ): Promise<DataSource> {
    switch (args.engine) {
      case "sqlite":
        return await (DBDriverSwitch.DBDriver as SQLiteDriver).connect(
          database,
          entities,
          schemaSync,

          args.dataDir
        );
      case "postgres":
        return await (DBDriverSwitch.DBDriver as PostgresDriver).connect(
          database,
          entities,
          schemaSync,

          args.host,
          args.username,
          args.password
        );
      default:
        break;
    }
  }

  static async disconnect(connection: DataSource): Promise<void> {
    return await DBDriverSwitch.DBDriver.disconnect(connection);
  }

  static async provision(connection: DataSource): Promise<void> {
    return await DBDriverSwitch.DBDriver.provision(connection);
  }

  static async createDB(name: string): Promise<void> {
    switch (args.engine) {
      case "sqlite":
        return await (DBDriverSwitch.DBDriver as SQLiteDriver).createDB(name);
      case "postgres":
        return await (DBDriverSwitch.DBDriver as PostgresDriver).createDB(
          name,
          DBDriverSwitch.postgresConnection
        );
      default:
        break;
    }
  }

  static async renameDB(
    oldName: string,
    newName: string
  ): Promise<void> {
    switch (args.engine) {
      case "sqlite":
        return await (DBDriverSwitch.DBDriver as SQLiteDriver).renameDB(
          oldName,
          newName,

          args.dataDir
        );
      case "postgres":
        return await (DBDriverSwitch.DBDriver as PostgresDriver).renameDB(
          oldName,
          newName,

          DBDriverSwitch.postgresConnection
        );
      default:
        break;
    }
  }

  static async deleteDB(name: string): Promise<void> {
    switch (args.engine) {
      case "sqlite":
        return await (DBDriverSwitch.DBDriver as SQLiteDriver).deleteDB(
          name,

          args.dataDir
        );
      case "postgres":
        return await (DBDriverSwitch.DBDriver as PostgresDriver).deleteDB(
          name,

          DBDriverSwitch.postgresConnection
        );
      default:
        break;
    }
  }
}