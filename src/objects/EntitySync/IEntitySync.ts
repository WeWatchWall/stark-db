import { Store } from "tinybase/store";
import { IConnection, IConnectionSchema } from "../Connection/IConnection";
import { z } from "zod";

export interface IEntitySyncArg {
  connection: IConnection;
}

export interface IEntitySync extends IEntitySyncArg {
  get(): Promise<Store>;
  destroy(): Promise<void>;
}

export const IEntitySyncSchema = z.object({
  connection: IConnectionSchema,
});