import Multee from 'multee-browser';

import { WorkerCall } from '../../utils/threadCalls';
import { Worker } from './threads';

const multee = Multee();

let instance: Worker;

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: WorkerCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case WorkerCall.init:
        instance = new Worker(callArgs.args[0]);
        return await instance.init();
      case WorkerCall.run:
        return await instance.run(
          callArgs.args[0],
          callArgs.args[1],
        );

      // Pause is not usually called this way...
      //   instead, it is called through the Broadcast Channel.
      //   This is just for testing.
      case WorkerCall.pause:
        return await instance.pause(
          callArgs.args[0],
          callArgs.args[1],
        );

      case WorkerCall.stop:
        return await instance.destroy();
    }
  }
);

export function workerInit() {
  const worker = multee.start(__filename);
  return {
    run: job(worker),
    worker: worker
  };
}