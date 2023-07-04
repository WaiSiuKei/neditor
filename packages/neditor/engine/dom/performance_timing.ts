// Implements the PerformanceTiming IDL interface, as described here:
//   https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html#sec-navigation-timing-interface

import { TimeTicks } from '@neditor/core/base/time/time';
import { BasicClock, OffsetClock } from '../base/clock';

export class PerformanceTiming {
  // The navigation start time relative to January 1, 1970.
  private navigation_start_: TimeTicks;
  private navigation_start_clock_: OffsetClock;
  // If any new public fields are added here, handling logic must be added to
  // Performance::Mark and Performance::Measure.
  constructor(clock: BasicClock, time_origin: TimeTicks) {
    this.navigation_start_ = time_origin;
    this.navigation_start_clock_ = new OffsetClock(clock, clock.Now());
  }
  // This attribute must return the time immediately after the user agent
  // finishes prompting to unload the previous document. If there is no previous
  // document, this attribute must return the time the current document is
  // created.
  navigation_start(): number {
    return this.navigation_start_.ToInternalValue();
  }
  // Custom, not in any spec.

  // Returns a clock that is relative to the navigation start time, and based
  // off of the clock passed into Performance (the one that navigation start
  // time was derived from).
  GetNavigationStartClock(): OffsetClock {
    return this.navigation_start_clock_;
  }
}
