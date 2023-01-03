import Multee from 'multee-browser';

import { ResultList } from '../../objects/resultList';
import { ThreadCall } from '../../utils/threadCall';
import { Saver } from './threads';

const multee = Multee();

let instance: Saver;

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: ThreadCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case ThreadCall.init:
        instance = new Saver(
          callArgs.args[0],
          callArgs.args[1],
        );
        return await instance.init();

      // Inbound through the Broadcast Channel. This is just for testing.
      case ThreadCall.get:
        return await instance.get();
      case ThreadCall.add:
        return await instance.add(
          ResultList.init(callArgs.args[0]),
        );

      // Outbound through the BC. This is just for testing.
      case ThreadCall.del:
        return await instance.del(
          callArgs.args[0],
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