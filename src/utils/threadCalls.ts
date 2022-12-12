export enum PersistCall {
  init = 'init',

  // Queue: Get a transaction ID through a Broadcast Channel.
  // Saver: NOOP.
  get = 'get',

  // Queue: add a transaction to the queue.
  // Saver: add a transaction to the DB.
  add = 'add',

  // Queue: Update the threads with new WAL entries.
  //   Gets called only internally. Also on outbound messages.
  // Saver: Gets called internally when finished the DB update.
  set = 'set',
  
  // Queue: Delete from the short WAL.
  //   Gets called only internally. Also on outbound messages.
  // Saver: NOOP.
  del = 'del',

  // Finish all the transactions and destroy all the resources.
  destroy = 'destroy',
}

export enum WorkerCall {
  init = 'init',

  run = 'run', // Run a query.
  pause = 'pause', // Pause the thread for long transactions.
  stop = 'stop', // Stop the thread and destroy it.
}