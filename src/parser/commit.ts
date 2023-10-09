import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { NEWLINE, STATEMENT_DELIMITER, ZERO } from '../utils/constants';
import { LazyLoader } from '../utils/lazyLoader';
import { LazyValidator } from '../utils/lazyValidator';
import { QueryParse, QueryParseArg } from './queryParse';

export class CommitArg {
  script?: string;
  params?: any[];
  statements?: QueryParseArg[] | QueryParse[];
}

export class Commit {
  loader: LazyLoader;
  validator: LazyValidator;

  script: string;
  params: any[];
  statements: QueryParse[];

  private isSave: boolean;

  /**
   * Creates an instance of the class.
   * @param [init] @type {QueryParseArg} The initial values.
   */
  constructor(init: CommitArg) {
    // Hook up the loader.
    this.loader = new LazyLoader(
      () => this.load.apply(this, []),
      () => this.save.apply(this, [])
    );

    // Apply the arguments and load the script.
    if (init != undefined) {
      Object.assign(this, init);
      this.script = this.script?.trim();

      this.loader.save();
    }
  }

  /* #region  Loads from the script string. */
  private load(): void {
    this.validator = new LazyValidator(
      () => this.loadValidate.apply(this, []),
      () => this.loadReady.apply(this, [])
    );

    this.isSave = false;
    this.validator.valid();

    if (this.isSave) { return; }
    
    this.validator.ready();
  }

  private loadValidate(): void {
    CommitLoad.test(this, (errors: any[]) => {
      if (errors?.length > ZERO) {
        this.isSave = true;
      }
    });
  }

  private loadReady(): void {
    // Split the script into statements.
    const statements = this
      .script
      .split(STATEMENT_DELIMITER)
      .filter((statement) => statement.trim() !== '')
      .map((statement) => `${ statement.trim() }${ STATEMENT_DELIMITER }`);

    let startParam = 0;

    // Parse the script statements.
    this.statements = statements.map((statement: string) => {
      // Count and extract the number of parameters in the statement.
      const paramCount = Commit.countString(statement, `\\?`);
      const params = this.params.slice(startParam, startParam + paramCount);
      startParam += paramCount;

      // Create validate, and return the statement.
      const statementMeta = new QueryParse({ query: statement, params });
      statementMeta.validator.ready();
      return statementMeta;
    });
  }

  private static countString(str: string, letter: string) {
      // creating regex 
      const re = new RegExp(letter, `g`);
  
      // matching the pattern
      const count = str.match(re)?.length || ZERO;
  
      return count;
  }
  /* #endregion */

  /* #region  Save to the script string. */
  private save(): void {
    // Don't run the save if this is a load.
    if (!this.isSave) { return; }

    this.validator = new LazyValidator(
      () => this.saveValidate.apply(this, []),
      () => this.saveReady.apply(this, [])
    );
    this.validator.ready();
  }

  private saveValidate(): void {
    new ScriptSave(this);
  }

  private saveReady(): void {
    let statements = [];
    this.params = [];

    for (const statement of this.statements) {
      statement.validator.ready();
      statements.push(statement.toString());

      this.params.push(...statement.params);
    }

    this.script = statements.join(NEWLINE);
  }
  /* #endregion */

  toObject(): CommitArg {
    return {
      script: this.script,
      params: this.params,
      statements: this.statements.map((statement) => statement.toObject()),
    };
  }

  /**
   * Gets the string representation of the instance.
   * @returns string 
   */
  toString(): string {
    return this.script;
  }
}

/* #region  Use schema to check the properties. */
const CommitLoad = new ObjectModel({
  script: String,
  params: ArrayModel(Any),
  statements: undefined,
});

const ScriptSave = new ObjectModel({
  script: [String],
  params: [ArrayModel(Any)],
  statements: ArrayModel(QueryParse),
});
/* #endregion */