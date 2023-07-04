import { TimeDelta, TimeTicks } from '@neditor/core/base/time/time';
import { DCHECK } from '@neditor/core/base/check';

export abstract class BasicClock {
  abstract Now(): TimeDelta
}

// The SystemClock calls in to the standard ::base::TimeTicks::HighResNow()
// method to obtain a time.
export class SystemMonotonicClock extends BasicClock {
  origin_: TimeTicks;
  constructor() {
    super();
    this.origin_ = TimeTicks.Now();
  }
  Now(): TimeDelta {
    return TimeTicks.Now().SUB(this.origin_);
  }
}

// The OffsetClock takes a parent clock and an offset upon construction, and
// when queried for the time it returns the time of the parent clock offset by
// the specified offset.
export class OffsetClock extends BasicClock {
  private parent_: BasicClock;
  private origin_: TimeDelta;
  constructor(parent: BasicClock, origin: TimeDelta) {
    super();
    DCHECK(parent);
    this.parent_ = parent;
    this.origin_ = origin;
  }

  Now(): TimeDelta { return this.parent_.Now().SUB(this.origin_); }

  origin(): TimeDelta { return this.origin_; }
}
