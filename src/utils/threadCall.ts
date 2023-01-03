export enum ThreadCall {
  init = 'init',

  // Queue: Get a transaction ID through a Broadcast Channel.
  // Saver: Get the first transaction ID from the WAL.
  get = 'get',

  // Queue: add a transaction to the queue.
  // Saver: add a transaction to the DB.
  // Worker: add a commit list to the DB.
  add = 'add',

  // Queue: Update the threads with new WAL entries.
  //   Gets called only internally. Also on outbound messages.
  // Saver: Gets called internally when finished the DB update.
  set = 'set',

  // Saver: Delete from the WAL.
  //   Gets called only internally. Also on outbound messages.
  del = 'del',

  // Finish all the transactions and destroy all the resources.
  destroy = 'destroy',
}