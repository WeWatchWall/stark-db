import sqliteParser from '@appland/sql-parser';
import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { LazyValidator } from '../utils/lazyValidator';
import { QueryParse, READ_ONLY_Qs } from './queryParse';
import { STATEMENT_DELIMITER } from '../utils/constants';

class ScriptParseArg {
  script: string;
  params: any[];
}

export class ScriptParse {
  validator: LazyValidator;

  script: string;
  params: any[];

  isReadOnly: boolean;
  queries: QueryParse[];

  /**
   * Creates an instance of the class.
   * @param [init] @type {ScriptParseArg} The initial value.
   */
  constructor(init?: ScriptParseArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, []),
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.ready();
    }
  }

  private validate(): void {
    this.script = this.script?.trim() || '';
    this.params = this.params || [];

    new ScriptParseInitArg(this);
  }

  private ready(): void {
    // Parse the whole script to validate it.
    sqliteParser(this.script);
    
    // Initialize the queries array.
    this.queries = [];
    // Check if the script is empty.
    if (!this.script) { return; }

    // Split up the script into lines.
    // This might be a bit tricky because of the semicolon in trigger
    //   definitions.
    const candidateLines = this.script.split(STATEMENT_DELIMITER);

    // Iterate over the lines.
    let query = [];
    for (let i = 0; i < candidateLines.length; i++) {
      query.push(candidateLines[i]);

      try {
        // Join the lines into a query.
        const queryStr = query.join(STATEMENT_DELIMITER);
        
        // Try to parse the query.
        sqliteParser(queryStr);

        // If the line is parsable, add it to the queries array.
        const queryParse = new QueryParse({
          query: queryStr,
          params: this.params,
        });
        this.queries.push(queryParse);

        // Reset the query.
        query = [];
      } catch (error) {
        // If the query is not parsable, continue.
        continue;
      }
    }

    // Check if all the queries are read-only.
    this.isReadOnly = this.queries.every(q => READ_ONLY_Qs.has(q.type));
  }
}

const ScriptParseInitArg = new ObjectModel({
  script: String,
  params: ArrayModel(Any),
});