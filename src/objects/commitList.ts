import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import { NEWLINE } from '../utils/constants';
import { LazyLoader } from '../utils/lazyLoader';
import { LazyValidator } from '../utils/lazyValidator';
import { Commit } from './commit';

export class CommitListArg {
  script?: string;
  params?: any[];
  commits?: Commit[];
}

export class CommitList {
  loader: LazyLoader;
  validator: LazyValidator;

  script: string;
  params: any[];
  commits: Commit[];

  private isSave: boolean;

  /**
   * Creates an instance of the class.
   * @param [init] @type {CommitListArg} The initial values.
   */
  constructor(init: CommitListArg) {
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
    try {
      this.validator.valid();
    } catch (error) {
      this.isSave = true;
    }

    if (this.isSave) { return; }
    
    this.validator.ready();
  }

  private loadValidate(): void {
    new CommitListLoad(this);
  }

  private loadReady(): void {
    
  }
  /* #endregion */

  /* #region  Saves to the script string. */
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
    new CommitListSave(this);
  }

  private saveReady(): void {
    this.script = this.commits.map((commit) => commit.script).join(NEWLINE);
    this.params = this.commits.map((commit) => commit.params).flat();
  }
  /* #endregion */

  /**
   * Gets the string representation of the instance.
   * @returns string 
   */
  toString(): string {
    return this.script;
  }
}

/* #region  Use schema to check the properties. */
const CommitListLoad = new ObjectModel({
  script: String,
  params: ArrayModel(Any),
  commits: undefined,
});

const CommitListSave = new ObjectModel({
  script: [String],
  params: [ArrayModel(Any)],
  commits: ArrayModel(Commit),
});
/* #endregion */