import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import shortHash from 'shorthash2';

import {
  PARAMETER_TOKEN,
  STATEMENT_DELIMITER,
  VALUE_DELIMITER,
  ZERO
} from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { RawQuery } from './rawQuery';

/* #region  Single result. */
export class ResultArg {
  name: string;
  keys: string[];

  rows: any[];
}

export class Result {
  validator: LazyValidator;

  name: string;
  keys: string[];
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
        result[key] = row[key];
      });

      return result;
    });

    return {
      name: this.name,
      keys: this.keys,
      rows: rows,
    };
  }

  toObject(): ResultArg {
    return {
      name: this.name,
      keys: this.keys,
      rows: this.rows,
    };
  }

  toUpdate(): RawQuery {
    const queryParts: string[] = [
      `INSERT OR REPLACE INTO ${this.name} VALUES `,
    ];
    const queryParams: any[] = [];

    let rowKeys: string[];
    for (let index = 0; index <this.rows.length; index++) {
      const row = this.rows[index];
      if (rowKeys == undefined) { rowKeys = Object.keys(row); }
      const rowParts: string[] = [];

      for (const key of rowKeys) {
        rowParts.push(PARAMETER_TOKEN);
        queryParams.push(row[key]);
      }

      const rowDelimiter = index === ZERO ? `` : VALUE_DELIMITER;
      queryParts.push(`${rowDelimiter}(${rowParts.join(VALUE_DELIMITER)})`);
    }

    queryParts.push(STATEMENT_DELIMITER);

    return new RawQuery({
      query: queryParts.join(``),
      params: queryParams,
    });
  }
}

/* #region  Use schema to check the properties. */
const ResultInitArg = new ObjectModel({
  name: String,
  keys: ArrayModel(String),
  rows: ArrayModel(Any),
});
/* #endregion */
/* #endregion */