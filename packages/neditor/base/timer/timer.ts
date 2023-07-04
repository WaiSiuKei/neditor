import { TimeDelta, TimeTicks } from '../time/time';
import { registerFinalizable } from '../common/finalization';
import { IDisposable } from '../common/lifecycle';
import { DCHECK } from '../check';
import { Closure } from '../callback';

// BaseTimerTaskInternal is a simple delegate for scheduling a callback to Timer
// on the current sequence. It also handles the following edge cases:
// - deleted by the task runner.
// - abandoned (orphaned) by Timer.
class BaseTimerTaskInternal implements IDisposable {
  constructor(timer: TimerBase) {
    registerFinalizable(this);

    this.timer_ = timer;
  }

  dispose() {
// This task may be getting cleared because the task runner has been
    // destructed.  If so, don't leave Timer with a dangling pointer
    // to this.
    if (this.timer_)
      this.timer_.AbandonAndStop();
  }

  Run() {
    // |timer_| is nullptr if we were abandoned.
    if (!this.timer_)
      return;

    // |this| will be deleted by the task runner, so Timer needs to forget us:
    this.timer_.scheduled_task_ = undefined;

    // Although Timer should not call back into |this|, let's clear |timer_|
    // first to be pedantic.
    let timer = this.timer_;
    this.timer_ = undefined;
    timer.RunScheduledTask();
  }

  // The task remains in the queue, but nothing will happen when it runs.
  Abandon() { this.timer_ = undefined; }

  private timer_?: TimerBase;
};

abstract class TimerBase {
  // Delay requested by user.
  private delay_?: TimeDelta;
  // The desired run time of |user_task_|. The user may update this at any time,
  // even if their previous request has not run yet. If |desired_run_time_| is
  // greater than |scheduled_run_time_|, a continuation task will be posted to
  // wait for the remaining time. This allows us to reuse the pending task so as
  // not to flood the delayed queues with orphaned tasks when the user code
  // excessively Stops and Starts the timer. This time can be a "zero" TimeTicks
  // if the task must be run immediately.
  private desired_run_time_?: TimeTicks;
  // When non-null, the |scheduled_task_| was posted to call RunScheduledTask()
  // at |scheduled_run_time_|.
  scheduled_task_?: BaseTimerTaskInternal;
  // If true, |user_task_| is scheduled to run sometime in the future.
  private is_running_: boolean = false;

  // The time at which |scheduled_task_| is expected to fire. This time can be a
  // "zero" TimeTicks if the task must be run immediately.
  private scheduled_run_time_?: TimeTicks;

  constructor(
    delay?: TimeDelta
  ) {
    this.delay_ = delay;
  }

  // Call this method to stop and cancel the timer.  It is a no-op if the timer
  // is not running.
  Stop(): void {
    // TODO(gab): Enable this when it's no longer called racily from
    // RunScheduledTask(): https://crbug.com/587199.
    // DCHECK(origin_sequence_checker_.CalledOnValidSequence());

    this.is_running_ = false;

    // It's safe to destroy or restart Timer on another sequence after Stop().
    // origin_sequence_checker_.DetachFromSequence();

    this.OnStop();
    // No more member accesses here: |this| could be deleted after Stop() call.
  }
  abstract OnStop(): void
  abstract RunUserTask(): void

  IsRunning() {
    return this.is_running_;
  }

  StartInternal(delay: TimeDelta) {

    this.delay_ = delay;

    this.Reset();
  }

  // Stop running task (if any) and abandon scheduled task (if any).
  AbandonAndStop() {
    this.AbandonScheduledTask();

    this.Stop();
    // No more member accesses here: |this| could be deleted at this point.
  }

  AbandonScheduledTask() {
    // TODO(gab): Enable this when it's no longer called racily from
    // RunScheduledTask() -> Stop(): https://crbug.com/587199.
    // DCHECK(origin_sequence_checker_.CalledOnValidSequence());
    if (this.scheduled_task_) {
      this.scheduled_task_.Abandon();
      this.scheduled_task_ = undefined;
    }
  }

  RunScheduledTask() {
    // TODO(gab): Enable this when it's no longer called racily:
    // https://crbug.com/587199.
    // DCHECK(origin_sequence_checker_.CalledOnValidSequence());

    // Task may have been disabled.
    if (!this.is_running_)
      return;
    DCHECK(this.desired_run_time_);

    // First check if we need to delay the task because of a new target time.
    if (this.desired_run_time_!.GT(this.scheduled_run_time_!)) {
      // Now() can be expensive, so only call it if we know the user has changed
      // the |desired_run_time_|.
      let now = TimeTicks.Now();
      // Task runner may have called us late anyway, so only post a continuation
      // task if the |desired_run_time_| is in the future.
      if (this.desired_run_time_!.GT(now)) {
        // Post a new task to span the remaining time.
        this.PostNewScheduledTask(this.desired_run_time_!.SUB(now));
        return;
      }
    }

    this.RunUserTask();
    // No more member accesses here: |this| could be deleted at this point.
  }

  PostNewScheduledTask(delay: TimeDelta) {
    // TODO(gab): Enable this when it's no longer called racily from
    // RunScheduledTask(): https://crbug.com/587199.
    // DCHECK(origin_sequence_checker_.CalledOnValidSequence());
    DCHECK(!this.scheduled_task_);
    this.is_running_ = true;
    this.scheduled_task_ = new BaseTimerTaskInternal(this);
    if (delay.GT(TimeDelta.FromMilliseconds(0))) {
      // TODO(gab): Posting BaseTimerTaskInternal::Run to another sequence makes
      // this code racy. https://crbug.com/587199
      setTimeout(() => this.scheduled_task_!.Run(), delay.InMilliseconds());
      this.scheduled_run_time_ = this.desired_run_time_ = TimeTicks.Now().ADD(delay);
    } else {
      setTimeout(() => this.scheduled_task_!.Run(), 0);
      this.scheduled_run_time_ = this.desired_run_time_ = new TimeTicks();
    }
  }

  Reset() {
    DCHECK(this.delay_);
    // If there's no pending task, start one up and return.
    if (!this.scheduled_task_) {
      this.PostNewScheduledTask(this.delay_!);
      return;
    }

    // Set the new |desired_run_time_|.
    if (this.delay_!.GT(TimeDelta.FromMicroseconds(0)))
      this.desired_run_time_ = TimeTicks.Now().ADD(this.delay_!);
    else
      this.desired_run_time_ = new TimeTicks();

    // We can use the existing scheduled task if it arrives before the new
    // |desired_run_time_|.
    if (this.desired_run_time_.GE(this.scheduled_run_time_!)) {
      this.is_running_ = true;
      return;
    }

    // We can't reuse the |scheduled_task_|, so abandon it and post a new one.
    this.AbandonScheduledTask();
    this.PostNewScheduledTask(this.delay_!);
  }
  GetCurrentDelay(): TimeDelta {
    return this.delay_!;
  }
}

export class RepeatingTimer extends TimerBase {
  private user_task_?: () => any;

  constructor()
  constructor(delay: TimeDelta, user_task: () => any,)
  constructor(delay?: TimeDelta, user_task?: () => any) {
    super(delay);
    this.user_task_ = user_task;
    if (delay && user_task) {
      user_task();
      // this.StartInternal(delay);
    }
  }
  // Start the timer to run at the given |delay| from now. If the timer is
  // already running, it will be replaced to call the given |user_task|.
  Start(delay: TimeDelta, user_task: () => any) {
    // console.log('start', delay.InSeconds(), delay.InMilliseconds(), delay.InMicroseconds(), user_task());
    // setInterval(user_task, delay.InMilliseconds(),);
    user_task();
  }
  RunUserTask(): void {
    // Make a local copy of the task to run in case the task destroy the timer
    // instance.
    let task = this.user_task_;
    this.PostNewScheduledTask(this.GetCurrentDelay());
    if (task) {
      task();
    }
    // No more member accesses here: |this| could be deleted at this point.
  }
  OnStop(): void {
  }
}

//-----------------------------------------------------------------------------
// A simple, one-shot timer.  See usage notes at the top of the file.
export class OneShotTimer extends TimerBase {
  // constructor(tick_clock: TickClock) {super();}
  constructor() {super();}
  // explicit OneShotTimer(const TickClock* tick_clock);
  // ~OneShotTimer() override;

  // Start the timer to run at the given |delay| from now. If the timer is
  // already running, it will be replaced to call the given |user_task|.
  Start(
    delay: TimeDelta,
    user_task: Closure) {
    this.user_task_ = user_task;
    this.StartInternal(delay);
  }

  // Start the timer to run at the given |delay| from now. If the timer is
  // already running, it will be replaced to call a task formed from
  // |reviewer->*method|.
  // template <class Receiver>
  // void Start(
  //   TimeDelta delay,
  // Receiver* receiver,
  //   void (Receiver::*method)()) {
  //   Start( delay, BindOnce(method, Unretained(receiver)));
  // }

  // Run the scheduled task immediately, and stop the timer. The timer needs to
  // be running.
  FireNow() {
    DCHECK(this.IsRunning());

    this.RunUserTask();
  }

  OnStop(): void {
    this.user_task_ = undefined;
  }
  RunUserTask() {
    // Make a local copy of the task to run. The Stop method will reset the
    // |user_task_| member.
    let task = this.user_task_!;
    this.Stop();
    DCHECK(task);
    task();
    // No more member accesses here: |this| could be deleted at this point.
  }
  private user_task_?: Closure;
}
