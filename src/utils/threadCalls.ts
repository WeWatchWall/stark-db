export enum DBCall {
  init = 'init',

  // Transaction queue thread.
  resize = 'resize', // Update the number of Broadcast Channels to use.
  get = 'get', // Get a transaction ID from the queue.
  add = 'add', // Add to the queue.

  // DB thread.
  set = 'set', // Update the DB.
}

export enum MemCall {
  init = 'init',

  // Transaction queue thread.
  resize = 'resize', // Update the number of Broadcast Channels to use.
  get = 'get', // Get a transaction ID from the queue.
  add = 'add', // Add to the queue.

  // DB thread.
  set = 'set', // Update the DB.
}

export enum WorkerCall {
  init = 'init',

  run = 'run', // Run a query.
  pause = 'pause', // Pause the thread for long transactions.
  stop = 'stop', // Stop the thread and destroy it.
}