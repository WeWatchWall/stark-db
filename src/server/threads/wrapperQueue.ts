import Multee from 'multee';
import { Results } from '../../objects/results';

import { PersistCall } from '../../utils/threadCalls';
import { Queue } from './threads';

const multee = Multee('worker');

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
        );
        return await instance.init();

      // The following methods are not usually called this way...
      //   instead, they are called through the Broadcast Channel.
      //   This is just for testing.
      case PersistCall.resize:
        return await instance.resize(callArgs.args[0]);
      case PersistCall.get:
        return await instance.get();
      case PersistCall.add:
        return await instance.add(
          Results.init(callArgs.args[0]),
        );
      
      // These following methods are not called directly or through the
      //   Broadcast Channel(BC). They are only for outbound updates to the
      //   workers thorugh the BC. This is just for testing.
      case PersistCall.set:
        return await instance.set(
          Results.init(callArgs.args[0]),
        );
      case PersistCall.del:
        return await instance.del(
          callArgs.args[0],
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