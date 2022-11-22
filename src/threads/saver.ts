import { DataSource } from 'typeorm';

import { Results } from '../objects/results';
import { Target } from '../utils/constants';
import { IEngine, ISaver } from './IThreads';

export abstract class SaverBase implements ISaver, IEngine {
  target: Target;
  DB: DataSource;

  constructor(target: Target) {
    this.target = target;
  }

  abstract init(): Promise<void>;

  add(_id: number, _target: Target, _results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  destroy(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}