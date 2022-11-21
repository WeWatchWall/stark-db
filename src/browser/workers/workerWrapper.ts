import Multee from 'multee-browser';

import { WorkerCall } from '../../utils/threadCalls';

const multee = Multee();

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: WorkerCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case WorkerCall.init:
        return;
      case WorkerCall.run:
        return;
      case WorkerCall.stop:
        return;

      // Pause is not usually called this way...
      //   instead, it is called through the Broadcast Channel.
      //   This is just for testing.
      case WorkerCall.pause:
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