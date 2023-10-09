import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import shortHash from 'shorthash2';

import {
  NEWLINE,
  ONE,
  PARAMETER_TOKEN,
  STATEMENT_DELIMITER,
  VALUE_DELIMITER,
  ZERO
} from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Method } from '../utils/method';
import { QueryRaw } from '../parser/queryRaw';

/* #region  Single result. */
export class ResultArg {
  name: string;
  autoKeys: string[];
  keys: string[];

  method: Method;
  rows: any[];
}

export class Result {
  validator: LazyValidator;

  name: string;
  autoKeys: string[];
  keys: string[];
  method: Method;
  rows: any[];

  /**
   * Creates an instance of the class.
   * @param [init] @type {ResultArg} The initial value.
   */
  constructor(init?: ResultArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }

  private validate(): void {
    new ResultInitArg(this);
  }

  toHashObject(): ResultArg {
    // Get the ID object.
    const idObject = this.toIDObject();

    // Loop through the rows and return the hashes.
    const hashes = idObject.rows.map((id) => shortHash(JSON.stringify(id)));
    
    // Set the rows to the hashes.
    idObject.rows = hashes;
    return idObject;
  }

  toIDObject(): ResultArg {
    // Loop through the rows and return the IDs.
    const rows = this.rows.map((row) => {
      const result = {};

      // Each ID can be multiple columns.
      this.keys.forEach((key) => {
        // @ts-ignore
        result[key] = row[key];
      });

      return result;
    });

    return {
      name: this.name,
      autoKeys: this.autoKeys,
      keys: this.keys,
      method: this.method,
      rows: rows,
    };
  }

  toObject(): ResultArg {
    return {
      name: this.name,
      autoKeys: this.autoKeys,
      keys: this.keys,
      method: this.method,
      rows: this.rows,
    };
  }

  toUpdate(): QueryRaw {
    switch (this.method) {
      case Method.add:
      case Method.set:
        return Result.toUpdateUpsert(
          this.name,
          this.autoKeys,
          this.rows,
          this.method
        );
      case Method.del:
        return Result.toUpdateDelete(this.name, this.keys, this.rows);
      default:
        throw new Error(`Invalid method: ${this.method}`);
    }
  }

  static toUpdateDelete(name: string, keys: string[], rows: any[]): QueryRaw {
    const rowTemplate: string = `DELETE FROM ${name} WHERE `;
    const queryParts: string[] = [rowTemplate];
    const queryParams: any[] = [];

    for (let rIndex = 0; rIndex < rows.length; rIndex++) {
      if (rIndex > ZERO) { queryParts.push(`${NEWLINE}  OR `); }
      const row = rows[rIndex];

      const keyParts: string[] = [];
      for (let kIndex = 0; kIndex < keys.length; kIndex++) {
        if (kIndex > ZERO) { keyParts.push(` AND `); }

        const key = keys[kIndex];
        keyParts.push(`${key} = ${PARAMETER_TOKEN}`);
        queryParams.push(row[key]);
      }

      queryParts.push(`(${keyParts.join(``)})`);
    }

    queryParts.push(STATEMENT_DELIMITER);

    return new QueryRaw({
      query: queryParts.join(` `),
      params: queryParams,
    });
  }

  private static toUpdateUpsert(
    name: string,
    autoKeys: string[],
    rows: any[],
    method: Method
  ): QueryRaw {
    const queryParts: string[] = [];
    const queryParams: any[] = [];

    let columns: string[];
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowParts: string[] = [];

      // Initialize the columns and query start.
      if (columns == undefined) {
        // Get the columns without auto-increment.
        columns = Object.keys(row);

        // Filter out the auto-increment columns when adding data.
        if (method === Method.add) {
          const autoKeySet = new Set<string>(autoKeys);
          columns = columns.filter((column) => !autoKeySet.has(column));
        }

        queryParts.push(`INSERT OR REPLACE INTO ${name} `);

        // Add the columns.
        let columnQuery = JSON.stringify(columns);
        columnQuery = columnQuery.substring(ONE, columnQuery.length - ONE);
        queryParts.push(`(${columnQuery}) VALUES `);
      }

      for (const key of columns) {
        rowParts.push(PARAMETER_TOKEN);
        queryParams.push(row[key]);
      }

      const rowDelimiter = index === ZERO ? `` : VALUE_DELIMITER;
      queryParts.push(`${rowDelimiter}(${rowParts.join(VALUE_DELIMITER)})`);
    }

    queryParts.push(STATEMENT_DELIMITER);

    return new QueryRaw({
      query: queryParts.join(``),
      params: queryParams,
    });
  }
}

// Use schema to check the properties.
const ResultInitArg = new ObjectModel({
  name: String,
  autoKeys: ArrayModel(String),
  keys: ArrayModel(String),
  method: [Method.add, Method.del, Method.get, Method.set],
  rows: ArrayModel(Any),
});
/* #endregion */