import { z } from "zod";

export interface IDB {
  name: string;

  add(): void;
  delete(): void;
  set(name: string): void;
}


export const IDBSchema = z.object({
  name: z.string(),
});