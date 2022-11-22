import { DataSource } from 'typeorm';

import { Results } from '../objects/results';
import { target } from '../utils/constants';
import { IEngine, ISaver } from './IThreads';

export abstract class SaverBase implements ISaver, IEngine {
  target: target;
  DB: DataSource;

  constructor(target: target) {
    this.target = target;
  }

  abstract init(): Promise<void>;

  add(_id: number, _target: target, _results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  destroy(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}