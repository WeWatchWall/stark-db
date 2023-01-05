import FlatPromise from 'flat-promise';

import { CommitList } from '../objects/commitList';
import { ResultList } from '../objects/resultList';
import { SAVER_CHANNEL, Target, ZERO } from '../utils/constants';
import { ThreadCall } from '../utils/threadCall';

export class ChanQueue {
  protected id: number;
  protected name: string;

  protected getPromiseDB: FlatPromise;

  protected queueIn: any;
  protected queueDBOut: any;

  protected saveID: number;
  
  constructor(id: number) {
    this.id = id;

    const queueInName = `${SAVER_CHANNEL}-${this.name}-in`;
    this.queueIn = new BroadcastChannel(queueInName);

    const queueDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.queueDBOut = new BroadcastChannel(queueDBOutName);
  }

  async add(
    resultListDB: ResultList[],
    _resultListMem?: ResultList[]
  ): Promise<void> {
    for (const resultList of resultListDB) {
      this.queueIn.postMessage({
        method: ThreadCall.add,
        args: [resultList]
      });
    }
  }

  async get(
    commitListDB: CommitList,
    isLong: boolean
  ): Promise<number[]> {
    this.getPromiseDB = new FlatPromise();
    
    this.queueDBOut.onmessage = this.listenQueueDB;

    this.queueIn.postMessage({
      method: ThreadCall.get,
      args: [
        this.id,

        commitListDB.commits.map(
          commit => commit.statements.map(statement => statement.query)
        ),
        commitListDB.commits.map(
          commit => commit.statements.map(statement => statement.params)
        ),

        isLong
      ]
    });

    let commitDBIds: number[];
    try {   
      // Wait for the queue to respond with the commit IDs.
      commitDBIds = await this.getPromiseDB.promise;

    // Cleanup.
    } finally {
      // Cleanup the noisy channels.
      this.queueDBOut.removeEventListener('message', this.listenQueueDB);

      // Cleanup the class state.
      delete this.saveID;
      delete this.getPromiseDB;
    }

    return commitDBIds;
  }

  async del(commitID: number): Promise<void> {
    this.queueIn.postMessage({
      method: ThreadCall.add,
      args: [
        new ResultList({
          id: commitID,
          isLong: false,
          target: Target.DB,
          results: []
        }).toObject()
      ]
    });
  }

  async destroy(): Promise<void> {
    if (this.queueIn == undefined) { return; }

    if (!!this.getPromiseDB) {
      this.getPromiseDB.reject();
    }

    // Clean up the Broadcast Channels.
    this.queueIn.close();
    this.queueDBOut.close();
    delete this.queueIn;
    delete this.queueDBOut;
  }

  protected async callMethod(event: any): Promise<any> {
    const { name, args }: {
      name: ThreadCall, args: any[]
    } = event.data;

    if (name === ThreadCall.get) {
      return await this.parseGet(args[0], args[1], args[2]);
    }
  }

  protected async listenQueueDB(message: any): Promise<any> {
    return await this.callMethod(message);
  }

  protected async parseGet(
    threadID: number,
    saveID: number,
    commitIDs: number[]
  ): Promise<void> {
    if (threadID !== this.id) { return; }

    this.saveID = saveID;    
    this.getPromiseDB.resolve(commitIDs);
  }
}

export class ChanQueueMem extends ChanQueue {
  protected getPromiseMem: FlatPromise;
  protected queueMemOut: any;

  constructor(id: number) {
    super(id);
    
    const queueMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;
    this.queueMemOut = new BroadcastChannel(queueMemOutName);
  }

  async add(
    resultListDB: ResultList[],
    resultListMem: ResultList[]
  ): Promise<void> {
    await super.add(resultListDB);

    for (const resultList of resultListMem) {
      this.queueIn.postMessage({
        method: ThreadCall.add,
        args: [resultList]
      });
    }
  }

  async get(
    commitListDB: CommitList,
    isLong: boolean
  ): Promise<number[]> {
    super.getPromiseDB = new FlatPromise();
    this.getPromiseMem = new FlatPromise();

    this.queueDBOut.onmessage = this.listenQueueDB;
    this.queueMemOut.onmessage = this.listenQueueMem;
    
    // Send the get request to the queue.
    this.queueIn.postMessage({
      method: ThreadCall.get,
      args: [
        this.id,

        commitListDB.commits.map(
          commit => commit.statements.map(statement => statement.query)
        ),
        commitListDB.commits.map(
          commit => commit.statements.map(statement => statement.params)
        ),

        isLong
      ]
    });

    let commitDBIds: number[]; let commitMemIds: number[];
    try {   
      // Wait for the queue to respond with the commit IDs.
      [commitDBIds, commitMemIds] = await Promise.all([
        this.getPromiseDB.promise,
        this.getPromiseMem.promise
      ]);

      // Sanity check between DB and memory.
      if (
        commitDBIds[ZERO] != commitMemIds[ZERO] ||
        commitDBIds.length !== commitMemIds.length
      ) {
        throw new Error("Commit IDs don't match.");
      }

    // Cleanup.
    } finally {
      // Cleanup the noisy channels.
      this.queueDBOut.removeEventListener('message', this.listenQueueDB);
      this.queueMemOut.removeEventListener('message', this.listenQueueMem);

      // Cleanup the class state.
      delete this.saveID;
      delete super.getPromiseDB;
      delete this.getPromiseMem;
    }

    return commitDBIds;
  }

  async del(commitID: number): Promise<void> {
    super.del(commitID);

    this.queueIn.postMessage({
      method: ThreadCall.add,
      args: [
        new ResultList({
          id: commitID,
          isLong: false,
          target: Target.mem,
          results: []
        }).toObject()
      ]
    });
  }

  async destroy(): Promise<void> {
    await super.destroy();

    if (this.queueMemOut == undefined) { return; }

    if (!!this.getPromiseMem) {
      this.getPromiseMem.reject();
    }

    // Clean up the Broadcast Channels.
    this.queueMemOut.close();
    delete this.queueMemOut;
  }

  protected async callMethod(event: any): Promise<any> {
    const { name, args }: {
      name: ThreadCall, args: any[]
    } = event.data;

    if (name === ThreadCall.get) {
      return await this.parseGet(args[0], args[1], args[2]);
    }
  }

  protected async listenQueueMem(message: any): Promise<any> {
    return await this.callMethod(message);
  }

  protected async parseGet(
    threadID: number,
    _saveID: number,
    commitIDs: number[]
  ): Promise<void> {
    if (threadID !== this.id) { return; }

    this.getPromiseMem.resolve(commitIDs);
  }

}