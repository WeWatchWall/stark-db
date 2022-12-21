import AwaitLock from 'await-lock';
import FIFO from 'fifo';
import FlatPromise from 'flat-promise';
import { DataSource } from 'typeorm';
import { Commit } from '../entity/commit';

import { Results } from '../objects/results';
import {
  ONE,
  QUEUE_CHANNEL,
  SAVER_CHANNEL,
  Target,
  ZERO
} from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { IQueue } from './IThreads';

export abstract class QueueBase implements IQueue {
  name: string;
  target: Target;

  DB?: DataSource;
  in: any;
  out: any;
  saverIn: any;
  saverOut: any;

  protected inName: string;
  protected outName: string;

  protected saverInName: string;
  protected saverOutName: string;

  private commitLock: AwaitLock;
  private commitLong?: number;

  private currentCommit: number;
  private currentPromise: FlatPromise;
  private lastCommit: number;
  private queue: FIFO<Results>;

  constructor(name: string, target: Target, commit = ZERO) {
    this.name = name;
    this.target = target;

    // DB and Memory use the same channel to avoid deadlocks.
    this.inName = `${QUEUE_CHANNEL}-${this.name}-in`;
    this.outName = `${QUEUE_CHANNEL}-${this.target}-${this.name}-out`;
    this.saverInName = `${SAVER_CHANNEL}-${this.target}-${this.name}-in`;
    this.saverOutName = `${SAVER_CHANNEL}-${this.target}-${this.name}-out`;

    this.commitLock = new AwaitLock();
    this.currentCommit = ZERO;
    this.currentPromise = new FlatPromise();
    this.lastCommit = commit;
    this.queue = new FIFO();
  }

  abstract init(): Promise<void>;

  async get(
    threadID: number,
    target: Target,

    queries: string[][],
    params: any[][][],

    isLong: boolean[],
    count = ONE
  ): Promise<number[]> {
    // Don't run on the wrong target.
    if (this.target === Target.mem && target !== Target.mem) { return []; }

    // Set count to be the minimum of all the argument lengths.
    count = Math.min(queries.length, params.length, isLong.length, count);
    if (count < ONE) { return []; }

    await this.commitLock.acquireAsync();
    
    // Assign the commit IDs and update the last commit.
    const commitIds = Array
      .from(Array(count))
      .map((_value, index: number) => this.lastCommit + index + ONE);
    this.lastCommit = commitIds[commitIds.length - ONE];

    // Add the commit to the queue table if targeting the server DB.
    if (this.DB != undefined && this.target === Target.DB) {
      const commits: Commit[] = [];

      // Create the commit entities.
      for (let i = 0; i < commitIds.length; i++) {
        const commitId = commitIds[i];
        const commitQueries = queries[i];
        const commitParams = params[i];
        const commitIsLong = isLong[i];

        const commitEntity = new Commit({
          id: commitId,
  
          queries: commitQueries,
          params: commitParams,
  
          isSaved: false,
          isLong: commitIsLong
        });

        commits.push(commitEntity);
      }

      await this.DB.manager.save(commits);
    }

    // Send the response.
    this.out.postMessage({
      name: PersistCall.get,
      args: [threadID, commitIds]
    });

    // Conditionally release the lock if this isn't a long transaction.
    // Adding the commit to the DB while locked might make this unfeasible,
    //   so this might need to come before that.
    if (this.DB != undefined && isLong) {
      this.commitLong = this.lastCommit;
    } else {
      this.commitLock.release();
    }

    return commitIds;
  }

  async add(results: Results): Promise<void> {
    // Don't run on the wrong target.
    // Even if there is a result for both targets, the memory result may be
    //   empty.
    if (this.target !== results.target) { return; }

    this.queue.push(results);

    // Wait until the queue is caught up.
    while (this.currentCommit > ZERO && this.currentCommit < results.id - ONE) {
      await this.currentPromise;
    }

    // Call the saver with the task.
    this.saverIn.postMessage({
      name: PersistCall.add,
      args: [results]
    });
  }

  async set(results: Results): Promise<void> {
    // Call the workers with the task results.
    this.out.postMessage({
      name: PersistCall.set,
      args: [results]
    });

    // Release the lock if this is the long transaction.
    if (this.commitLong !== undefined && this.commitLong === results.id) {
      this.commitLock.release();
      delete this.commitLong;
    }

    // Update the state of the queue.
    this.currentCommit = results.id;
    const tempPromise = this.currentPromise;
    this.currentPromise = new FlatPromise();
    tempPromise.resolve();    
  }

  async del(commit: number): Promise<void> {
    // Get the next results from the queue.
    const { value: results } = this.queue.shift();

    // Make sure the queue is synched with the saver.
    if (results == undefined || results.id !== commit) {
      throw new Error(`Invalid commit: ${commit}`);
    }

    // Report the results to the workers.
    await this.set(results);
  }

  async destroy(): Promise<void> {
    // Don't destroy twice.
    if (this.in == undefined) { return; }

    // Prevent further commits.
    await this.commitLock.acquireAsync();
    
    // Wait until all the commits are saved.
    while (this.currentCommit > ZERO && this.currentCommit < this.lastCommit) {
      await this.currentPromise;
    }

    // Clean up the Broadcast Channel.
    this.in.close();
    this.out.close();
    this.saverIn.close();
    this.saverOut.close();

    delete this.in;
    delete this.out;
    delete this.saverIn;
    delete this.saverOut;

    if (this.DB == undefined) { return; }

    // Clean up the DataSource.
    await this.DB.destroy();
    delete this.DB;
  }
  
  protected async callMethod(event: any): Promise<any> {
    const { name, args }: {
      name: PersistCall, args: any[]
    } = event.data;

    switch (name) {
      case PersistCall.get:
        return await this.get(
          args[0],
          args[1],
          args[2],
          args[3],
          args[4]
        );
      case PersistCall.add:
        return await this.add(Results.init(args[0]));
      case PersistCall.del:
        return await this.del(args[0]);
      default:
        break;
    }
  }
}