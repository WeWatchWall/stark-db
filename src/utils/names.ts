import { Method } from "./method";

const DIFFS_TABLE_PREFIX = '_stark_diffs';
const TRIGGER_PREFIX = '_stark_trigger';

const DIFF_CHANNEL = 'stark-diff';
const WORKER_CHANNEL = 'stark-worker';

export class Names {

  /* #region Channels. */
  static getDiffChannel(): string {
    return DIFF_CHANNEL;
  }

  static getWorkerMemTablesReset(name: string): string {
    return `${WORKER_CHANNEL}-${name}-reset`;
  }
  /* #endregion */

  /* #region SQL schema. */
  static getDiffTable(name: string, method: Method): string {
    return `${DIFFS_TABLE_PREFIX}_${method}_${name}`;
  }

  static getTrigger(name: string, method: Method): string {
    return `${TRIGGER_PREFIX}_${method}_${name}`;
  }
  /* #endregion */
}