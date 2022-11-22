import Multee from 'multee-browser';

import { QCall } from '../../utils/threadCalls';
import { DBQueue } from '../../workers/DBQueue';

const multee = Multee();

let instance: DBQueue;

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: QCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case QCall.init:
        instance = new DBQueue();
        return await instance.init();

      // The following methods are not usually called this way...
      //   instead, they are called through the Broadcast Channel.
      //   This is just for testing.
      case QCall.resize:
        return await instance.resize(callArgs.args[0]);
      case QCall.get:
        return await instance.get();
      case QCall.add:
        return await instance.add(
          callArgs.args[0],
          callArgs.args[1],
          callArgs.args[2],
        );
      
      // These following methods are not called directly or through the
      //   Broadcast Channel(BC). They are only for outbound updates to the
      //   workers thorugh the BC. This is just for testing.
      case QCall.set:
        return await instance.set(
          callArgs.args[0],
          callArgs.args[1],
          callArgs.args[2],
        );
      case QCall.del:
        return await instance.del(
          callArgs.args[0],
          callArgs.args[1],
        );
      
      case QCall.destroy:
        return await instance.destroy();
    }
  }
);

export const workerInit = () => {
  const worker = multee.start(__filename);
  return {
    run: job(worker),
    worker: worker
  };
}