import Multee from 'multee-browser';

import { DBCall } from '../../utils/threadCalls';

const multee = Multee();

const job = multee.createHandler(
  'job',
  async (callArgs: {
    name: DBCall,
    args: any[]
  }): Promise<any> => {
    switch (callArgs.name) {
      case DBCall.init:
        return;
      case DBCall.set:
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