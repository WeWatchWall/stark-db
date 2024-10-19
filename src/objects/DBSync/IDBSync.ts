import { DBEvent } from "../../entities/DBEvent";

export interface IDBSync {
  init(): Promise<void>;
  get(): Promise<DBEvent[]>;
  add(event: Partial<DBEvent>): Promise<void>;
  set(event: Partial<DBEvent>): Promise<void>;
  delete(event: Partial<DBEvent>): Promise<void>;
}