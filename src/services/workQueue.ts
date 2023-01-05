import { OrderedSet } from 'js-sdsl';

import { WorkItem } from '../objects/workItem';

/**
 * Work queue service that keeps track of the work items.
 */
export class WorkQueue {
  protected lookup: { [id: number]: WorkItem };
  private queue: OrderedSet<WorkItem>;

  /**
   * Creates an instance of the class.
   */
  constructor() {
    this.queue = new OrderedSet<WorkItem>([], (a, b) => a.id - b.id, true);
    this.lookup = {};
  }

  add(arg: WorkItem): WorkItem {
    const workItem = this.lookup[arg.id];
    if (workItem != undefined) { return workItem; }

    this.queue.insert(arg);
    this.lookup[arg.id] = arg;

    return arg;
  }

  set(arg: WorkItem): WorkItem {
    const workItem = this.lookup[arg.id];
    if (workItem == undefined) { return this.add(arg); }

    return Object.assign(workItem, arg);
  }

  get(start: number, end: number): WorkItem[] {
    if (!this.valid(start, end)) { return undefined; }
      
    const items: Array<WorkItem> = [];
    for (let index = start; index < end; index++) {
      items.push(this.lookup[index]);
    }

    return items;
  }

  del(ID: number): void {
    const delItems: Array<WorkItem> = [];

    // Determine the IDs to delete.
    for (const workItem of this.queue) {
      if (workItem.id >= ID) { break; }

      delItems.push(workItem);
    }

    // Delete the IDs.
    for (const delItem of delItems) {
      this.queue.eraseElementByKey(delItem);
      delete this.lookup[delItem.id];
    }
  }

  valid(start: number, end: number): boolean {
    for (let index = start; index < end; index++) {
      const workItem = this.lookup[index];
      if (workItem == undefined) { return false; }

      if (
        workItem.DB == undefined ||
        workItem.isDB == undefined
      ) { return false; }
    }

    return true;
  }
}

/**
 * Work queue service that checks the memory results.
 */
export class WorkQueueMem extends WorkQueue {
  valid(start: number, end: number): boolean {
    for (let index = start; index < end; index++) {
      const workItem = this.lookup[index];
      if (workItem == undefined) { return false; }

      if (
        workItem.DB == undefined ||
        workItem.isDB == undefined ||
        workItem.mem == undefined ||
        workItem.isMem == undefined
      ) { return false; }
    }

    return true;
  }
}
