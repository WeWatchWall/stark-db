import Multee from 'multee';

import { ThreadCall } from '../../utils/threadCalls';
import { Worker } from './threads';

const multee = Multee('worker');

let instance: Worker;

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: ThreadCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case ThreadCall.init:
        instance = new Worker(
          callArgs.args[0],
          callArgs.args[1],
        );
        return await instance.init();
      case ThreadCall.add:
        return await instance.add(
          callArgs.args[0],
          callArgs.args[1],
        );

      case ThreadCall.destroy:
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