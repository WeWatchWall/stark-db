import Multee from 'multee';

import { QCall } from '../../utils/threadCalls';
import { MemSaver } from '../../workers/memSaver';

const multee = Multee('worker');

let instance: MemSaver;

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: QCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case QCall.init:
        instance = new MemSaver();
        return await instance.init();
      
      // Add is not usually called this way...
      //   instead, it is called through the Broadcast Channel.
      //   This is just for testing.
      case QCall.add:
        return await instance.add(
          callArgs.args[0],
          callArgs.args[1],
          callArgs.args[2],
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