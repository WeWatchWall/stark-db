import { Result, Results, ResultsArg } from '../objects/results';
import { ONE, Target, ZERO } from '../utils/constants';

// TODO: test this...
export class DiffManager {
  mem: {
    // Table name.
    [key: string]: {
      keys: string[];
      rows: {
        // Hash of the key.
        [key: string]: {
          count: number;
          row: any[];
        }
      }
    }
  };

  constructor() {
    this.mem = {};
  }

  /**
   * Adds all the required tables to the diff manager.
   * @param arg @type {Results} The results to add.
   */
  add(arg: Results): void {
    for (const result of arg.results) {
      if (this.mem[result.name] != undefined) { continue; }

      this.mem[result.name] = {
        keys: result.keys,
        rows: {}
      };
    }
  }

  /**
   * Gets the a @type {Results} object from the diff manager memory.
   * @returns get @type {Results} The compiled results.
   */
  async get(): Promise<Results> {
    const results: Result[] = [];

    for (const tableName of Object.keys(this.mem)) {
      const table = this.mem[tableName];
      const rows: any[] = [];

      // Get the rows that have a count greater than zero.
      for (const hash of Object.keys(table.rows)) {
        const row = table.rows[hash];
        if (row.count > ZERO) { rows.push(row.row); }
      }

      results.push(
        new Result({
          name: tableName,
          keys: table.keys,
          rows
        })
      );
    }

    // Return a results object with dummy properties set up.
    return new Results({
      id: -ONE,
      isLong: false,
      target: Target.DB,
      results
    });
  }

  /**
   * Sets the row counts in the diff manager memory.
   * @param arg @type {Results} The results to set.
   * @param hashes @type {ResultsArg} The hashes that correspond to the results.
   */
  set(arg: Results, hashes: ResultsArg): void {
    this.add(arg);

    for (let i = 0; i < arg.results.length; i++) {
      // Get the result and hash sets.
      const resultSet = arg.results[i];
      const hashSet = hashes.results[i];
      
      for (let j = 0; j < resultSet.rows.length; j++) {
        // Get the row and hash.
        const row = resultSet.rows[j];
        const hash = hashSet.rows[j];

        // If the hash is not in the memory, add the row.
        const memTable = this.mem[resultSet.name].rows;
        const memRow = memTable[hash];
        if (memRow == undefined) {
          memTable[hash] = {
            count: 0,
            row,
          };

        // Otherwise, increment the count and update the row.
        } else {
          memRow.count++;
          memRow.row = row;
        }
      }
    }
  }

  /**
   * Deletes a set of results @type {ResultsArg} from the diff manager.
   * @param hashes  @type {ResultsArg} The hashes to delete.
   */
  del(hashes: ResultsArg): void {
    for (let i = 0; i < hashes.results.length; i++) {
      // Get the result and hash sets.
      const hashSet = hashes.results[i];
      const table = this.mem[hashSet.name];

      // If the table is not in the memory, continue.
      if (table == undefined) { continue; }

      for (let j = 0; j < hashSet.rows.length; j++) {
        // Get the row and hash.
        const hash = hashSet.rows[j];
        const item = table.rows[hash];

        // If the hash is not in the memory, continue.
        if (item == undefined) { continue; }

        // If the count is less than one, delete the row.
        item.count--;
        if (item.count < ONE) { delete table.rows[hash]; }
        if (Object.keys(table.rows).length < ONE) {
          delete this.mem[hashSet.name];
        }
      }
    }
  }

  /**
   * Destroys the diff manager memory.
   */
  destroy(): void {
    delete this.mem;
  }
}