import Multee from 'multee-browser';

import { MemCall } from '../../utils/threadCalls';

const multee = Multee();

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: MemCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case MemCall.init:
        return;
      case MemCall.set:
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