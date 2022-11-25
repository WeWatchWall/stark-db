import Multee from 'multee';

import { Results } from '../../objects/results';
import { PersistCall } from '../../utils/threadCalls';
import { Saver } from './threads';

const multee = Multee('worker');

let instance: Saver;

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: PersistCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case PersistCall.init:
        instance = new Saver(
          callArgs.args[0],
          callArgs.args[1],
        );
        return await instance.init();
      
      // Add is not usually called this way...
      //   instead, it is called through the Broadcast Channel.
      //   This is just for testing.
      case PersistCall.add:
        return await instance.add(
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