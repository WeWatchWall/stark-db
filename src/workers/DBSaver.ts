import { Results } from "../objects/results";
import { target } from "../utils/constants";
import { ISaver } from "./IThreads";

export class DBSaver implements ISaver {
  init(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  add(_id: number, _target: target, _results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  destroy(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}