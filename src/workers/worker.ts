import { Results } from "../objects/results";
import { target } from "../utils/constants";
import { IWorker } from "./IThreads";

export class Worker implements IWorker {
  init(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  run(_query: string, _args: any[]): Promise<Results> {
    throw new Error("Method not implemented.");
  }

  pause(_id: number, _target: target): Promise<void> {
    throw new Error("Method not implemented.");
  }

  destroy(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}