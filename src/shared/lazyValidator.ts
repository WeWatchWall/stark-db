import assert from "assert";
import StateMachine from 'javascript-state-machine';

export class LazyValidator {
  private machine?: {
    toJSON: () => string;
    is: (arg0: string) => boolean;
    step: () => void;
  };

  /**
   * Inits stateful with its FSM.
   * @param validate @type {Function}
   */
  constructor(
    validate: () => void,
    ready?: () => void
  ) {
    this.machine = new StateMachine({
      init: 'init',
      transitions: [
        { name: 'step', from: 'init', to: 'valid' },
        { name: 'step', from: 'valid', to: 'ready' },
        { name: 'step', from: 'ready', to: 'ready' }
      ],
      methods: {
        onValid: function () {
          validate();
        },
        onReady: function () {
          if (ready !== undefined) {
            ready();
          }
        }
      }
    });

    // Hide this large object in the JSON representation.
    this.machine.toJSON = () => '[StateMachine]';
  }

  /**
   * Readies the stateful to the required step.
   */
  private step(target: string): void {
    assert(
      this.machine !== undefined,
      'The lazy validator should be initialized before any transition.'
    );

    while (!this.machine.is(target)) {
      this.machine.step();
    }
  }

  valid(): void {
    this.step('valid');
  }
  
  ready(): void {
    this.step('ready');
  }
}