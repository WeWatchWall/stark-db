import { z } from "zod";

export interface IConnectionArg {
  name: string;
}

export interface IConnection extends IConnectionArg {
  connection: any;

  get(): Promise<boolean>;
  add(): Promise<void>;
  delete(): Promise<void>;
}

export const IConnectionSchema = z.object({
  name: z.string(),
});