import Multee from 'multee';

import { MemCall } from '../../utils/threadCalls';

const multee = Multee('worker');

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: MemCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case MemCall.init:
        return;
      
      // Get ID and adding to the queue is not usually called this way...
      //   instead, they are called through the Broadcast Channel.
      //   This is just for testing.
      case MemCall.resize:
        return;
      case MemCall.get:
        return;
      case MemCall.add:
        return;
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