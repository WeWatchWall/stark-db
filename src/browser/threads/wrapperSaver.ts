import Multee from 'multee-browser';

import { ResultList } from '../../objects/resultList';
import { PersistCall } from '../../utils/threadCalls';
import { Saver } from './threads';

const multee = Multee();

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

      // Inbound through the Broadcast Channel. This is just for testing.
      case PersistCall.get:
        return await instance.get();
      case PersistCall.add:
        return await instance.add(
          ResultList.init(callArgs.args[0]),
        );

      // Outbound through the BC. This is just for testing.
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