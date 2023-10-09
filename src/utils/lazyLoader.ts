import StateMachine from 'javascript-state-machine';

enum LoadState {
  init = 0,
  load = 1,
  save = 2,
}

export class LazyLoader {
  private machine?: {
    toJSON: () => string;
    is: (arg0: string) => boolean;
    state: string;
    step: () => void | Promise<void>;
  };

  /**
   * Inits stateful with its FSM.
   * @param load @type {Function}
   */
  constructor(
    load?: () => any,
    save?: () => any
  ) {
    // @ts-ignore
    this.machine = new StateMachine({
      init: 'init',
      transitions: [
        { name: 'step', from: LoadState[0], to: LoadState[1] },
        { name: 'step', from: LoadState[1], to: LoadState[2] },
        { name: 'step', from: LoadState[2], to: LoadState[2] }
      ],
      methods: {
        onLoad: function () {
          if (load != undefined) {
            return load();
          }
        },
        onSave: function () {
          if (save != undefined) {
            return save();
          }
        }
      }
    });

    // Hide this large object in the JSON representation.
    this.machine.toJSON = () => '[StateMachine]';
  }

  load(): void {
    this.step(LoadState.load);
  }

  async loadAsync(): Promise<void> {
    return await this.stepAsync(LoadState.load);
  }

  save(): void {
    this.step(LoadState.save);
  }
  
  async saveAsync(): Promise<void> {
    return await this.stepAsync(LoadState.save);
  }

  /**
   * Readies the stateful to the required step.
   */
  private step(target: LoadState): void {
    // @ts-ignore
    while (LoadState[this.machine.state] < target) {
      this.machine.step();
    }
  }

  /**
   * Readies the stateful to the required step if the handlers are async.
   */
  private async stepAsync(target: LoadState): Promise<void> {
    // @ts-ignore
    while (LoadState[this.machine.state] < target) {
      await this.machine.step();
    }
  }
}