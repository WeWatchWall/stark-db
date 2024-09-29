import { DatabasePersisterConfig } from "tinybase/persisters";
import { Store, TablesSchema } from "tinybase/store";
import { IConnection } from "../Connection/IConnection";
import { IEntitySync, IEntitySyncArg, IEntitySyncSchema } from "./IEntitySync";

export abstract class EntitySyncBase implements IEntitySync {
  connection: IConnection;

  protected schema: TablesSchema = {
    DBs: {
      id: { type: 'string' },
      enabled: { type: 'boolean' },
      readers: { type: 'string' }, // JSON stringified array
      writers: { type: 'string' }, // JSON stringified array
    },
  };
  protected config: DatabasePersisterConfig = {
    mode: 'tabular',
    tables: { load: { DBs: 'DBs' }, save: { DBs: 'DBs' } }
  };

  protected isInit = false;
  protected store: Store;
  constructor(arg: IEntitySyncArg) {
    IEntitySyncSchema.parse(arg);
    this.connection = arg.connection;
  }

  abstract get(): Promise<Store>;
  abstract delete(): Promise<void>;
}