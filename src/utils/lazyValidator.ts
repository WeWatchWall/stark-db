import StateMachine from 'javascript-state-machine';

enum ValidState {
  init = 0,
  valid = 1,
  ready = 2,
}

export class LazyValidator {
  private machine: {
    toJSON: () => string;
    is: (arg0: string) => boolean;
    state: string;
    step: () => void | Promise<void>;
  };

  /**
   * Inits stateful with its FSM.
   * @param validate @type {Function}
   */
  constructor(
    validate: () => void,
    ready?: () => any
  ) {
    // @ts-ignore
    this.machine = new StateMachine({
      init: 'init',
      transitions: [
        { name: 'step', from: ValidState[0], to: ValidState[1] },
        { name: 'step', from: ValidState[1], to: ValidState[2] },
        { name: 'step', from: ValidState[2], to: ValidState[2] }
      ],
      methods: {
        onValid: function () {
          validate();
        },
        onReady: function () {
          if (ready != undefined) {
            return ready();
          }
        }
      }
    });

    // Hide this large object in the JSON representation.
    this.machine.toJSON = () => '[StateMachine]';
  }

  valid(): void {
    this.step(ValidState.valid);
  }
  
  ready(): void {
    this.step(ValidState.ready);
  }

  async readyAsync(): Promise<void> {
    return await this.stepAsync(ValidState.ready);
  }

  /**
   * Readies the stateful to the required step.
   */
  private step(target: ValidState): void {
    // @ts-ignore
    while (ValidState[this.machine.state] < target) {
      this.machine.step(); // eslint-disable-line
    }
  }

  /**
   * Readies the stateful to the required step if the ready function is async.
   */
  private async stepAsync(target: ValidState): Promise<void> {
    // @ts-ignore
    while (ValidState[this.machine.state] < target) {
      await this.machine.step();
    }
  }
}