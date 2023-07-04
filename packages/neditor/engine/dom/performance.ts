// Copyright 2015 The Cobalt Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and

// Implements the Performance IDL interface, an instance of which is created
// and owned by the Window object.
//   https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html#sec-window.performance-attribute
import { TimeTicks } from '@neditor/core/base/time/time';
import { PerformanceTiming } from './performance_timing';
import { BasicClock } from '../base/clock';

export class Performance {
  // Ensure that the timer resolution is at the lowest 20 microseconds in
  // order to mitigate potential Spectre-related attacks.  This is following
  // Mozilla's lead as described here:
  //   https://www.mozilla.org/en-US/security/advisories/mfsa2018-01/
  // NOLINT(runtime/int)
  static kPerformanceTimerMinResolutionInMicroseconds = 20;
  //   https://www.w3.org/TR/2021/WD-resource-timing-2-20210414/#sec-extensions-performance-interface
  static kMaxResourceTimingBufferSize = 250;

  private time_origin_: TimeTicks;
  private timing_: PerformanceTiming;
  // Web API: Performance
  //   https://www.w3.org/TR/hr-time-2/#sec-performance
  timing() {
    return this.timing_;
  }
  constructor(clock: BasicClock) {
    this.time_origin_ = TimeTicks.Now();
    this.timing_ = new PerformanceTiming(clock, this.time_origin_);
  }

  SetApplicationStartOrPreloadTimestamp(is_preload: boolean, timestamp: number) {
    //  lifecycle_timing_->SetApplicationStartOrPreloadTimestamp(
    //      is_preload, timestamp);
  }
}
