// Implements the AnimationTimeline IDL interface.
//   https://www.w3.org/TR/2015/WD-web-animations-1-20150707/#the-animationtimeline-interface
import { BasicClock } from '../base/clock';
import { TimeDelta } from '@neditor/core/base/time/time';
import { Optional } from '@neditor/core/base/common/typescript';

export class AnimationTimeline {
  private clock_: BasicClock;
  private sampled_clock_time_?: TimeDelta;
  // next_event_timer_: OneShotTimer;

  // private event_queue_: TimedTaskQueue;

  constructor(clock: BasicClock) {
    this.clock_ = clock;
  }

  // Returns the current sample time of the timeline, in milliseconds.  If the
  // returned optional is not engaged, this timeline is 'unresolved'.
  current_time(): Optional<number> {
    if (this.sampled_clock_time_) {
      return this.sampled_clock_time_.InMilliseconds();
    } else {
      return;
    }
  }

  // The owner of this timeline should call Sample() each time a new sample
  // time is ready.
  Sample() {
    if (this.clock_) {
      this.sampled_clock_time_ = this.clock_.Now();
      // event_queue_.UpdateTime(this.sampled_clock_time_);
    } else {
      this.sampled_clock_time_ = undefined;
    }
    this.UpdateNextEventTimer();
  }

  private UpdateNextEventTimer() {
    // if (event_queue_.empty() || !this.sampled_clock_time_ || !this.clock_) {
    //   next_event_timer_.Stop();
    // } else {
    //  let delay = event_queue_.next_fire_time() - this.clock_.Now();
    //   this.next_event_timer_.Start(
    //     FROM_HERE, delay < new TimeDelta() ? TimeDelta() : delay,
    //     base::Bind(&AnimationTimeline::Sample, base::Unretained(this)));
    // }
  }
};
