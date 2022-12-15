import Multee from 'multee-browser';

import { Results } from '../../objects/results';
import { PersistCall } from '../../utils/threadCalls';
import { Queue } from './threads';

const multee = Multee();

let instance: Queue;

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: PersistCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case PersistCall.init:
        instance = new Queue(
          callArgs.args[0],
          callArgs.args[1],
          callArgs.args[2],
        );
        return await instance.init();

      // Inbound through the Broadcast Channel. This is just for testing.
      case PersistCall.get:
        return await instance.get(
          callArgs.args[0],
          callArgs.args[1],
          callArgs.args[2],
          callArgs.args[3],
          callArgs.args[4],
          callArgs.args[5],
        );
      case PersistCall.add:
        return await instance.add(
          Results.init(callArgs.args[0]),
        );
      
      // Outbound through the BC. This is just for testing.
      case PersistCall.set:
        return await instance.set(
          Results.init(callArgs.args[0]),
        );
      
      case PersistCall.destroy:
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