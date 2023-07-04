/**
 * An implementation of the "idle-until-urgent"-strategy as introduced
 * here: https://philipwalton.com/articles/idle-until-urgent/
 */
import { Disposable, IDisposable, MutableDisposable, toDisposable } from './lifecycle';
import { CancellationToken, CancellationTokenSource } from './cancellation';
import { CancellationError } from './errors';
import { Emitter, Event } from './event';
import { assertIsError } from './type';

export function isThenable<T>(obj: unknown): obj is Promise<T> {
  return !!obj && typeof (obj as unknown as Promise<T>).then === 'function';
}

export interface CancelablePromise<T> extends Promise<T> {
  cancel(): void;
}

export function createCancelablePromise<T>(
  callback: (token: CancellationToken) => Promise<T>,
): CancelablePromise<T> {
  const source = new CancellationTokenSource();

  const thenable = callback(source.token);
  const promise = new Promise<T>((resolve, reject) => {
    const subscription = source.token.onCancellationRequested(() => {
      subscription.dispose();
      source.dispose();
      reject(new CancellationError());
    });
    Promise.resolve(thenable).then(
      (value) => {
        subscription.dispose();
        source.dispose();
        resolve(value);
      },
      (err) => {
        subscription.dispose();
        source.dispose();
        reject(err);
      },
    );
  });

  return <CancelablePromise<T>>new (class {
    cancel() {
      source.cancel();
    }

    then<TResult1 = T,
      TResult2 = never,
      >(resolve?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, reject?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
      return promise.then(resolve, reject);
    }

    catch<TResult = never,
      >(reject?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult> {
      return this.then(undefined, reject);
    }

    finally(onfinally?: (() => void) | undefined | null): Promise<T> {
      return promise.finally(onfinally);
    }
  })();
}

/**
 * Returns a promise that resolves with `undefined` as soon as the passed token is cancelled.
 * @see {@link raceCancellationError}
 */
export function raceCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken,
): Promise<T | undefined>;

/**
 * Returns a promise that resolves with `defaultValue` as soon as the passed token is cancelled.
 * @see {@link raceCancellationError}
 */
export function raceCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken,
  defaultValue: T,
): Promise<T>;

export function raceCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken,
  defaultValue?: T,
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const ref = token.onCancellationRequested(() => {
      ref.dispose();
      resolve(defaultValue);
    });
    promise.then(resolve, reject).finally(() => ref.dispose());
  });
}

/**
 * Returns a promise that rejects with an {@CancellationError} as soon as the passed token is cancelled.
 * @see {@link raceCancellation}
 */
export function raceCancellationError<T>(
  promise: Promise<T>,
  token: CancellationToken,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const ref = token.onCancellationRequested(() => {
      ref.dispose();
      reject(new CancellationError());
    });
    promise.then(resolve, reject).finally(() => ref.dispose());
  });
}

// #region -- run on idle tricks ------------

export interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

/**
 * Execute the callback the next time the browser is idle
 */
export let runWhenIdle: (callback: (idle: IdleDeadline) => void, timeout?: number) => IDisposable;

declare function requestIdleCallback(
  callback: (args: IdleDeadline) => void,
  options?: { timeout: number },
): number;
declare function cancelIdleCallback(handle: number): void;

(function () {
  if (typeof requestIdleCallback !== 'function' || typeof cancelIdleCallback !== 'function') {
    const dummyIdle: IdleDeadline = Object.freeze({
      didTimeout: true,
      timeRemaining() {
        return 15;
      },
    });
    runWhenIdle = (runner) => {
      const handle = setTimeout(() => runner(dummyIdle));
      let disposed = false;
      return {
        dispose() {
          if (disposed) {
            return;
          }
          disposed = true;
          clearTimeout(handle);
        },
      };
    };
  } else {
    runWhenIdle = (runner, timeout?) => {
      const handle: number = requestIdleCallback(
        runner,
        typeof timeout === 'number' ? { timeout } : undefined,
      );
      let disposed = false;
      return {
        dispose() {
          if (disposed) {
            return;
          }
          disposed = true;
          cancelIdleCallback(handle);
        },
      };
    };
  }
})();

export class IdleValue<T> {
  private readonly _executor: () => void;
  private readonly _handle: IDisposable;

  private _didRun = false;
  private _value?: T;
  private _error: unknown;

  constructor(executor: () => T) {
    this._executor = () => {
      try {
        this._value = executor();
      } catch (err) {
        this._error = err;
      } finally {
        this._didRun = true;
      }
    };
    this._handle = runWhenIdle(() => this._executor());
  }

  dispose(): void {
    this._handle.dispose();
  }

  get value(): T {
    if (!this._didRun) {
      this._handle.dispose();
      this._executor();
    }
    if (this._error) {
      throw this._error;
    }
    return this._value!;
  }
}

// #endregion

export class Throttler {
  private activePromise: Promise<any> | null;
  private queuedPromise: Promise<any> | null;
  private queuedPromiseFactory: ITask<Promise<any>> | null;

  constructor() {
    this.activePromise = null;
    this.queuedPromise = null;
    this.queuedPromiseFactory = null;
  }

  queue<T>(promiseFactory: ITask<Promise<T>>): Promise<T> {
    if (this.activePromise) {
      this.queuedPromiseFactory = promiseFactory;

      if (!this.queuedPromise) {
        const onComplete = () => {
          this.queuedPromise = null;

          const result = this.queue(this.queuedPromiseFactory!);
          this.queuedPromiseFactory = null;

          return result;
        };

        this.queuedPromise = new Promise((resolve) => {
          this.activePromise!.then(onComplete, onComplete).then(resolve);
        });
      }

      return new Promise((resolve, reject) => {
        this.queuedPromise!.then(resolve, reject);
      });
    }

    this.activePromise = promiseFactory();

    return new Promise((resolve, reject) => {
      this.activePromise!.then(
        (result: T) => {
          this.activePromise = null;
          resolve(result);
        },
        (err: unknown) => {
          this.activePromise = null;
          reject(err);
        },
      );
    });
  }
}

/**
 * A helper to delay execution of a task that is being requested often, while
 * preventing accumulation of consecutive executions, while the task runs.
 *
 * The mail man is clever and waits for a certain amount of time, before going
 * out to deliver letters. While the mail man is going out, more letters arrive
 * and can only be delivered once he is back. Once he is back the mail man will
 * do one more trip to deliver the letters that have accumulated while he was out.
 */
export class ThrottledDelayer<T> {
  private delayer: Delayer<Promise<T>>;
  private throttler: Throttler;

  constructor(defaultDelay: number) {
    this.delayer = new Delayer(defaultDelay);
    this.throttler = new Throttler();
  }

  trigger(promiseFactory: ITask<Promise<T>>, delay?: number): Promise<T> {
    return this.delayer.trigger(
      () => this.throttler.queue(promiseFactory),
      delay,
    ) as unknown as Promise<T>;
  }

  isTriggered(): boolean {
    return this.delayer.isTriggered();
  }

  cancel(): void {
    this.delayer.cancel();
  }

  dispose(): void {
    this.delayer.dispose();
  }
}

/**
 * A barrier that is initially closed and then becomes opened permanently.
 */

export class Barrier<T> {
  private _isOpen: boolean;
  private _promise: Promise<T>;
  private _completePromise!: (v: T) => void;

  constructor() {
    this._isOpen = false;
    this._promise = new Promise<T>((c, e) => {
      this._completePromise = c;
    });
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  open(val?: T): void {
    this._isOpen = true;
    this._completePromise(val as T);
  }

  wait(): Promise<T> {
    return this._promise;
  }
}

export class TimeoutTimer implements IDisposable {
  private _token: any;

  constructor();
  constructor(runner: () => void, timeout: number);
  constructor(runner?: () => void, timeout?: number) {
    this._token = -1;

    if (typeof runner === 'function' && typeof timeout === 'number') {
      this.setIfNotSet(runner, timeout);
    }
  }

  dispose(): void {
    this.cancel();
  }

  cancel(): void {
    if (this._token !== -1) {
      clearTimeout(this._token);
      this._token = -1;
    }
  }

  cancelAndSet(runner: () => void, timeout: number): void {
    this.cancel();
    this._token = setTimeout(() => {
      this._token = -1;
      runner();
    }, timeout);
  }

  setIfNotSet(runner: () => void, timeout: number): void {
    if (this._token !== -1) {
      // timer is already set
      return;
    }
    this._token = setTimeout(() => {
      this._token = -1;
      runner();
    }, timeout);
  }
}

export class IntervalTimer implements IDisposable {
  private _token: any;

  constructor() {
    this._token = -1;
  }

  dispose(): void {
    this.cancel();
  }

  cancel(): void {
    if (this._token !== -1) {
      clearInterval(this._token);
      this._token = -1;
    }
  }

  cancelAndSet(runner: () => void, interval: number): void {
    this.cancel();
    this._token = setInterval(() => {
      runner();
    }, interval);
  }
}

export class RunOnceScheduler {
  protected runner: ((...args: unknown[]) => void) | null;

  private timeoutToken: any;
  private timeout: number;
  private timeoutHandler: () => void;

  constructor(runner: (...args: any[]) => void, delay: number) {
    this.timeoutToken = -1;
    this.runner = runner;
    this.timeout = delay;
    this.timeoutHandler = this.onTimeout.bind(this);
  }

  /**
   * Dispose RunOnceScheduler
   */
  dispose(): void {
    this.cancel();
    this.runner = null;
  }

  /**
   * Cancel current scheduled runner (if any).
   */
  cancel(): void {
    if (this.isScheduled()) {
      clearTimeout(this.timeoutToken);
      this.timeoutToken = -1;
    }
  }

  /**
   * Cancel previous runner (if any) & schedule a new runner.
   */
  schedule(delay = this.timeout): void {
    this.cancel();
    this.timeoutToken = setTimeout(this.timeoutHandler, delay);
  }

  get delay(): number {
    return this.timeout;
  }

  set delay(value: number) {
    this.timeout = value;
  }

  /**
   * Returns true if scheduled.
   */
  isScheduled(): boolean {
    return this.timeoutToken !== -1;
  }

  private onTimeout() {
    this.timeoutToken = -1;
    if (this.runner) {
      this.doRun();
    }
  }

  protected doRun(): void {
    if (this.runner) {
      this.runner();
    }
  }
}

export interface IThrottledWorkerOptions {
  /**
   * maximum of units the worker will pass onto handler at once
   */
  maxWorkChunkSize: number;

  /**
   * maximum of units the worker will keep in memory for processing
   */
  maxBufferedWork: number | undefined;

  /**
   * delay before processing the next round of chunks when chunk size exceeds limits
   */
  throttleDelay: number;
}

/**
 * The `ThrottledWorker` will accept units of work `T`
 * to handle. The contract is:
 * * there is a maximum of units the worker can handle at once (via `maxWorkChunkSize`)
 * * there is a maximum of units the worker will keep in memory for processing (via `maxBufferedWork`)
 * * after having handled `maxWorkChunkSize` units, the worker needs to rest (via `throttleDelay`)
 */
export class ThrottledWorker<T> extends Disposable {
  private readonly pendingWork: T[] = [];

  private readonly throttler = this._register(new MutableDisposable<RunOnceScheduler>());
  private disposed = false;

  constructor(
    private options: IThrottledWorkerOptions,
    private readonly handler: (units: T[]) => void,
  ) {
    super();
  }

  /**
   * The number of work units that are pending to be processed.
   */
  get pending(): number {
    return this.pendingWork.length;
  }

  /**
   * Add units to be worked on. Use `pending` to figure out
   * how many units are not yet processed after this method
   * was called.
   *
   * @returns whether the work was accepted or not. If the
   * worker is disposed, it will not accept any more work.
   * If the number of pending units would become larger
   * than `maxPendingWork`, more work will also not be accepted.
   */
  work(units: readonly T[]): boolean {
    if (this.disposed) {
      return false; // work not accepted: disposed
    }

    // Check for reaching maximum of pending work
    if (typeof this.options.maxBufferedWork === 'number') {
      // Throttled: simple check if pending + units exceeds max pending
      if (this.throttler.value) {
        if (this.pending + units.length > this.options.maxBufferedWork) {
          return false; // work not accepted: too much pending work
        }
      }

        // Unthrottled: same as throttled, but account for max chunk getting
      // worked on directly without being pending
      else {
        if (
          this.pending + units.length - this.options.maxWorkChunkSize >
          this.options.maxBufferedWork
        ) {
          return false; // work not accepted: too much pending work
        }
      }
    }

    // Add to pending units first
    this.pendingWork.push(...units);

    // If not throttled, start working directly
    // Otherwise, when the throttle delay has
    // past, pending work will be worked again.
    if (!this.throttler.value) {
      this.doWork();
    }

    return true; // work accepted
  }

  private doWork(): void {
    // Extract chunk to handle and handle it
    this.handler(this.pendingWork.splice(0, this.options.maxWorkChunkSize));

    // If we have remaining work, schedule it after a delay
    if (this.pendingWork.length > 0) {
      this.throttler.value = new RunOnceScheduler(() => {
        this.throttler.clear();

        this.doWork();
      }, this.options.throttleDelay);
      this.throttler.value.schedule();
    }
  }

  dispose(): void {
    super.dispose();

    this.disposed = true;
  }
}

export interface ITask<T> {
  (): T;
}

/**
 * A helper to delay (debounce) execution of a task that is being requested often.
 *
 * Following the throttler, now imagine the mail man wants to optimize the number of
 * trips proactively. The trip itself can be long, so he decides not to make the trip
 * as soon as a letter is submitted. Instead he waits a while, in case more
 * letters are submitted. After said waiting period, if no letters were submitted, he
 * decides to make the trip. Imagine that N more letters were submitted after the first
 * one, all within a short period of time between each other. Even though N+1
 * submissions occurred, only 1 delivery was made.
 *
 * The delayer offers this behavior via the trigger() method, into which both the task
 * to be executed and the waiting period (delay) must be passed in as arguments. Following
 * the example:
 *
 *    const delayer = new Delayer(WAITING_PERIOD);
 *    const letters = [];
 *
 *    function letterReceived(l) {
 * 			letters.push(l);
 * 			delayer.trigger(() => { return makeTheTrip(); });
 * 		}
 */
export class Delayer<T> implements IDisposable {
  private timeout: any;
  private completionPromise: Promise<any> | null;
  private doResolve: ((value?: any | Promise<any>) => void) | null;
  private doReject: ((err: any) => void) | null;
  private task: ITask<T | Promise<T>> | null;

  constructor(public defaultDelay: number) {
    this.timeout = null;
    this.completionPromise = null;
    this.doResolve = null;
    this.doReject = null;
    this.task = null;
  }

  trigger(task: ITask<T | Promise<T>>, delay: number = this.defaultDelay): Promise<T> {
    this.task = task;
    this.cancelTimeout();

    if (!this.completionPromise) {
      this.completionPromise = new Promise((resolve, reject) => {
        this.doResolve = resolve;
        this.doReject = reject;
      }).then(() => {
        this.completionPromise = null;
        this.doResolve = null;
        if (this.task) {
          const task = this.task;
          this.task = null;
          return task();
        }
        return undefined;
      });
    }

    this.timeout = setTimeout(() => {
      this.timeout = null;
      if (this.doResolve) {
        this.doResolve(null);
      }
    }, delay);

    return this.completionPromise;
  }

  isTriggered(): boolean {
    return this.timeout !== null;
  }

  cancel(): void {
    this.cancelTimeout();

    if (this.completionPromise) {
      if (this.doReject) {
        this.doReject(new Error('canceled'));
      }
      this.completionPromise = null;
    }
  }

  private cancelTimeout(): void {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  dispose(): void {
    this.cancelTimeout();
  }
}

export function wait(ms: number): Promise<void> {
  return new Promise((c) => {
    setTimeout(c, ms);
  });
}
// #region

export type ValueCallback<T = unknown> = (value: T | Promise<T>) => void;

/**
 * Creates a promise whose resolution or rejection can be controlled imperatively.
 */
export class DeferredPromise<T> {
  private completeCallback!: ValueCallback<T>;
  private errorCallback!: (err: unknown) => void;
  private rejected = false;
  private resolved = false;

  public get isRejected() {
    return this.rejected;
  }

  public get isResolved() {
    return this.resolved;
  }

  public get isSettled() {
    return this.rejected || this.resolved;
  }

  public p: Promise<T>;

  constructor() {
    this.p = new Promise<T>((c, e) => {
      this.completeCallback = c;
      this.errorCallback = e;
    });
  }

  public complete(value: T) {
    return new Promise<void>((resolve) => {
      this.completeCallback(value);
      this.resolved = true;
      resolve();
    });
  }

  public error(err: unknown) {
    return new Promise<void>((resolve) => {
      this.errorCallback(err);
      this.rejected = true;
      resolve();
    });
  }

  public cancel() {
    // eslint-disable-next-line no-new
    new Promise<void>((resolve) => {
      this.errorCallback(new CancellationError());
      this.rejected = true;
      resolve();
    });
  }
}

// #endregion

// #region Promises

export namespace Promises {
  /**
   * A drop-in replacement for `Promise.all` with the only difference
   * that the method awaits every promise to either fulfill or reject.
   *
   * Similar to `Promise.all`, only the first error will be returned
   * if any.
   */
  export async function settled<T>(promises: Promise<T>[]): Promise<T[]> {
    let firstError: Error | undefined;

    const result = await Promise.all(
      promises.map((promise) =>
        promise.then(
          (value) => value,
          (error) => {
            if (!firstError) {
              firstError = error;
            }

            return undefined; // do not rethrow so that other promises can settle
          },
        ),
      ),
    );

    if (typeof firstError !== 'undefined') {
      throw firstError;
    }

    return result as unknown as T[]; // cast is needed and protected by the `throw` above
  }

  /**
   * A helper to create a new `Promise<T>` with a body that is a promise
   * itself. By default, an error that raises from the async body will
   * end up as a unhandled rejection, so this utility properly awaits the
   * body and rejects the promise as a normal promise does without async
   * body.
   *
   * This method should only be used in rare cases where otherwise `async`
   * cannot be used (e.g. when callbacks are involved that require this).
   */
  export function withAsyncBody<T, E = Error>(
    bodyFn: (resolve: (value: T) => unknown, reject: (error: E) => unknown) => Promise<unknown>,
  ): Promise<T> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<T>(async (resolve, reject) => {
      try {
        await bodyFn(resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// #endregion

export function timeout(millis: number): CancelablePromise<void>;
export function timeout(millis: number, token: CancellationToken): Promise<void>;
export function timeout(
  millis: number,
  token?: CancellationToken,
): CancelablePromise<void> | Promise<void> {
  if (!token) {
    return createCancelablePromise((token) => timeout(millis, token));
  }

  return new Promise((resolve, reject) => {
    const handle = setTimeout(() => {
      disposable.dispose();
      resolve();
    }, millis);
    const disposable = token.onCancellationRequested(() => {
      clearTimeout(handle);
      disposable.dispose();
      reject(new CancellationError());
    });
  });
}

interface ILimitedTaskFactory<T> {
  factory: ITask<Promise<T>>;
  c: (value: T | Promise<T>) => void;
  e: (error?: unknown) => void;
}

export interface ILimiter<T> {
  readonly size: number;

  queue(factory: ITask<Promise<T>>): Promise<T>;
}

/**
 * A helper to queue N promises and run them all with a max degree of parallelism. The helper
 * ensures that at any time no more than M promises are running at the same time.
 */
export class Limiter<T> implements ILimiter<T> {
  private _size = 0;
  private runningPromises: number;
  private readonly maxDegreeOfParalellism: number;
  private readonly outstandingPromises: ILimitedTaskFactory<T>[];
  private readonly _onDrained: Emitter<void>;

  constructor(maxDegreeOfParalellism: number) {
    this.maxDegreeOfParalellism = maxDegreeOfParalellism;
    this.outstandingPromises = [];
    this.runningPromises = 0;
    this._onDrained = new Emitter<void>();
  }

  /**
   * An event that fires when every promise in the queue
   * has started to execute. In other words: no work is
   * pending to be scheduled.
   *
   * This is NOT an event that signals when all promises
   * have finished though.
   */
  get onDrained(): Event<void> {
    return this._onDrained.event;
  }

  get size(): number {
    return this._size;
  }

  queue(factory: ITask<Promise<T>>): Promise<T> {
    this._size++;

    return new Promise<T>((c, e) => {
      this.outstandingPromises.push({ factory, c, e });
      this.consume();
    });
  }

  private consume(): void {
    while (this.outstandingPromises.length && this.runningPromises < this.maxDegreeOfParalellism) {
      const iLimitedTask = this.outstandingPromises.shift()!;
      this.runningPromises++;

      const promise = iLimitedTask.factory();
      promise.then(iLimitedTask.c, iLimitedTask.e);
      promise.then(
        () => this.consumed(),
        () => this.consumed(),
      );
    }
  }

  private consumed(): void {
    this._size--;
    this.runningPromises--;

    if (this.outstandingPromises.length > 0) {
      this.consume();
    } else {
      this._onDrained.fire();
    }
  }

  dispose(): void {
    this._onDrained.dispose();
  }
}

/**
 * A queue is handles one promise at a time and guarantees that at any time only one promise is executing.
 */
export class Queue<T> extends Limiter<T> {
  constructor() {
    super(1);
  }
}

export async function retry<T>(
  task: ITask<Promise<T>>,
  delay: number,
  retries: number,
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await task();
    } catch (error) {
      assertIsError(error);
      lastError = error;

      await timeout(delay);
    }
  }

  throw lastError;
}

export function disposableTimeout(handler: () => void, timeout = 0): IDisposable {
  const timer = setTimeout(handler, timeout);
  return toDisposable(() => clearTimeout(timer));
}

export class RunOnceWorker<T> extends RunOnceScheduler {
  private units: T[] = [];

  constructor(runner: (units: T[]) => void, timeout: number) {
    super(runner, timeout);
  }

  work(unit: T): void {
    this.units.push(unit);

    if (!this.isScheduled()) {
      this.schedule();
    }
  }

  protected doRun(): void {
    const units = this.units;
    this.units = [];

    if (this.runner) {
      this.runner(units);
    }
  }

  dispose(): void {
    this.units = [];

    super.dispose();
  }
}

// #region Task Sequentializer

interface IPendingTask {
  taskId: number;
  cancel: () => void;
  promise: Promise<void>;
}

interface ISequentialTask {
  promise: Promise<void>;
  promiseResolve: () => void;
  promiseReject: (error: Error) => void;
  run: () => Promise<void>;
}

export interface ITaskSequentializerWithPendingTask {
  readonly pending: Promise<void>;
}

export class TaskSequentializer {
  private _pending?: IPendingTask;
  private _next?: ISequentialTask;

  hasPending(taskId?: number): boolean {
    if (!this._pending) {
      return false;
    }

    if (typeof taskId === 'number') {
      return this._pending.taskId === taskId;
    }

    return !!this._pending;
  }

  get pending(): Promise<void> | undefined {
    return this._pending ? this._pending.promise : undefined;
  }

  cancelPending(): void {
    this._pending?.cancel();
  }

  setPending(taskId: number, promise: Promise<void>, onCancel?: () => void): Promise<void> {
    this._pending = { taskId, cancel: () => onCancel?.(), promise };

    promise.then(
      () => this.donePending(taskId),
      () => this.donePending(taskId),
    );

    return promise;
  }

  private donePending(taskId: number): void {
    if (this._pending && taskId === this._pending.taskId) {
      // only set pending to done if the promise finished that is associated with that taskId
      this._pending = undefined;

      // schedule the next task now that we are free if we have any
      this.triggerNext();
    }
  }

  private triggerNext(): void {
    if (this._next) {
      const next = this._next;
      this._next = undefined;

      // Run next task and complete on the associated promise
      next.run().then(next.promiseResolve, next.promiseReject);
    }
  }

  setNext(run: () => Promise<void>): Promise<void> {
    // this is our first next task, so we create associated promise with it
    // so that we can return a promise that completes when the task has
    // completed.
    if (!this._next) {
      let promiseResolve: () => void;
      let promiseReject: (error: Error) => void;
      const promise = new Promise<void>((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
      });

      this._next = {
        run,
        promise,
        promiseResolve: promiseResolve!,
        promiseReject: promiseReject!,
      };
    }

    // we have a previous next task, just overwrite it
    else {
      this._next.run = run;
    }

    return this._next.promise;
  }
}

// #endregion

export interface IWaitUntil {
  token: CancellationToken;
  waitUntil(thenable: Promise<unknown>): void;
}

export function nextTick(cb: () => void) {
  return Promise.resolve().then(cb);
}
