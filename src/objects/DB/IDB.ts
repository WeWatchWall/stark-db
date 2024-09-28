import { z } from "zod";

export interface IDBArg {
  name: string;
}

export interface IDB extends IDBArg {

  get(): Promise<boolean>;
  add(): Promise<void>;
  delete(): Promise<void>;
  set(name: string): Promise<void>;
}

export const IDBSchema = z.object({
  name: z.string(),
});