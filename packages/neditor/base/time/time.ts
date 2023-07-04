import { ClampAdd, ClampMul, ClampSub } from '../numerics/clamped_math';
import { castInt } from '../common/number';
import { CHECK_NE } from '../check_op';
import { CHECK } from '../check';
import { NOTREACHED } from '../common/notreached';

export class TimeDelta {
  static FromDays(days: number) {return Days(days);}
  static FromHours(hours: number) {return Hours(hours);}
  static FromMinutes(minutes: number) {return Minutes(minutes);}
  static FromSeconds(secs: number) {return Seconds(secs);}
  static FromMilliseconds(ms: number) {return Milliseconds(ms);}
  static FromMicroseconds(ms: number) {return Microseconds(ms);}
  // Returns the maximum time delta, which should be greater than any reasonable
  // time delta we might compare it to. If converted to double with ToDouble()
  // it becomes an IEEE double infinity. Use FiniteMax() if you want a very
  // large number that doesn't do this. TimeDelta math saturates at the end
  // points so adding to TimeDelta::Max() leaves the value unchanged.
  // Subtracting should leave the value unchanged but currently changes it
  // TODO(https://crbug.com/869387).
  static Max(): TimeDelta {
    return new TimeDelta(Number.MAX_SAFE_INTEGER);
  }
  // Returns the minimum time delta, which should be less than than any
  // reasonable time delta we might compare it to. For more details see the
  // comments for Max().
  static Min(): TimeDelta {
    return new TimeDelta(Number.MIN_SAFE_INTEGER);
  }
  // static FromMicroseconds(us: number);
  // static FromNanoseconds(ns: number);
  // Converts an integer value representing TimeDelta to a class. This is used
  // when deserializing a |TimeDelta| structure, using a value known to be
  // compatible. It is not provided as a constructor because the integer type
  // may be unclear from the perspective of a caller.
  //
  // DEPRECATED - Do not use in new code. http://crbug.com/634507
  static FromInternalValue(delta: number): TimeDelta {return new TimeDelta(delta);}

  // Returns true if the time delta is the maximum/minimum time delta.
  is_max(): boolean { return this.EQ(TimeDelta.Max()); }
  is_min(): boolean { return this.EQ(TimeDelta.Min()); }
  is_inf(): boolean { return this.is_min() || this.is_max(); }
  // Delta in microseconds.
  private delta_: number = 0;
  constructor(delta_us: number = 0) {
    this.delta_ = castInt(delta_us);
  }

  DivideOrMax(divisor: number): number {
    return this.is_max() ? Number.MAX_VALUE
      : this.delta_ / divisor;
  }

  InMicroseconds(): number { return this.delta_; }
  InMilliseconds(): number {
    if (!this.is_inf()) return this.delta_ / Time.kMicrosecondsPerMillisecond;
    return (this.delta_ < 0) ? Number.MIN_VALUE : Number.MAX_VALUE;
  }
  InSeconds(): number {
    return this.DivideOrMax(TimeBase.kMicrosecondsPerSecond);
  }

  SUB(other: TimeDelta): TimeDelta {
    if (!other.is_inf())
      return new TimeDelta(ClampSub(this.delta_, other.delta_));

    // Subtractions involving two infinities are only valid if signs differ.
    CHECK_NE(this.delta_, other.delta_);
    return (other.delta_ < 0) ? TimeDelta.Max() : TimeDelta.Min();
  }

  ADD(other: TimeDelta): TimeDelta {
    if (!other.is_inf())
      return new TimeDelta(ClampAdd(this.delta_, other.delta_));

    // Additions involving two infinities are only valid if signs match.
    CHECK(!this.is_inf() || (this.delta_ == other.delta_));
    return other;
  }

  EQ(other: TimeDelta): boolean { return this.delta_ == other.delta_; }
  LT(other: TimeDelta): boolean { return this.delta_ < other.delta_; }
  GT(other: TimeDelta): boolean { return this.delta_ > other.delta_; }
  GE(other: TimeDelta): boolean { return this.delta_ >= other.delta_; }
}

function Days(n: number): TimeDelta {
  return TimeDelta.FromInternalValue(ClampMul(n, TimeBase.kMicrosecondsPerDay));
}

function Hours(n: number): TimeDelta {
  return TimeDelta.FromInternalValue(ClampMul(n, TimeBase.kMicrosecondsPerHour));
}

function Minutes(n: number): TimeDelta {
  return TimeDelta.FromInternalValue(ClampMul(n, TimeBase.kMicrosecondsPerMinute));
}

function Seconds(n: number): TimeDelta {
  return TimeDelta.FromInternalValue(ClampMul(n, TimeBase.kMicrosecondsPerSecond));
}

function Milliseconds(n: number): TimeDelta {
  return TimeDelta.FromInternalValue(ClampMul(n, TimeBase.kMicrosecondsPerMillisecond));
}

function Microseconds(n: number): TimeDelta {
  return TimeDelta.FromInternalValue((n));
}

export class TimeBase {
  static kHoursPerDay = 24;
  static kSecondsPerMinute = 60;
  static kMinutesPerHour = 60;
  static kSecondsPerHour = TimeBase.kSecondsPerMinute * TimeBase.kMinutesPerHour;
  static kMillisecondsPerSecond = 1000;
  static kMillisecondsPerDay = TimeBase.kMillisecondsPerSecond * TimeBase.kSecondsPerHour * TimeBase.kHoursPerDay;
  static kMicrosecondsPerMillisecond = 1000;
  static kMicrosecondsPerSecond = TimeBase.kMicrosecondsPerMillisecond * TimeBase.kMillisecondsPerSecond;
  static kMicrosecondsPerMinute = TimeBase.kMicrosecondsPerSecond * TimeBase.kSecondsPerMinute;
  static kMicrosecondsPerHour = TimeBase.kMicrosecondsPerMinute * TimeBase.kMinutesPerHour;
  static kMicrosecondsPerDay = TimeBase.kMicrosecondsPerHour * TimeBase.kHoursPerDay;
  static kMicrosecondsPerWeek = TimeBase.kMicrosecondsPerDay * 7;
  static kNanosecondsPerMicrosecond = 1000;
  static kNanosecondsPerSecond = TimeBase.kNanosecondsPerMicrosecond * TimeBase.kMicrosecondsPerSecond;
  // Time value in a microsecond timebase.
  private us_: number;
  constructor(us: number = 0) {
    this.us_ = us;
  }

  // Returns true if this object has not been initialized.
  //
  // Warning: Be careful when writing code that performs math on time values,
  // since it's possible to produce a valid "zero" result that should not be
  // interpreted as a "null" value.
  is_null(): boolean { return this.us_ == 0; }

  // Returns true if this object represents the maximum/minimum time.
  is_max(): boolean { return this.EQ(TimeBase.Max()); }
  is_min(): boolean { return this.EQ(TimeBase.Min()); }
  is_inf(): boolean { return this.is_min() || this.is_max(); }

  // Returns the maximum/minimum times, which should be greater/less than than
  // any reasonable time with which we might compare it.
  static Max(): TimeBase {
    return new TimeBase(Number.MAX_VALUE);
  }

  static Min(): TimeBase {
    return new TimeBase(Number.MIN_VALUE);
  }

  // For legacy serialization only. When serializing to `base::Value`, prefer
  // the helpers from //base/json/values_util.h instead. Otherwise, use
  // `Time::ToDeltaSinceWindowsEpoch()` for `Time` and
  // `TimeDelta::InMiseconds()` for `TimeDelta`. See http://crbug.com/634507.
  ToInternalValue(): number { return this.us_; }

// The amount of time since the origin (or "zero") point. This is a syntactic
// convenience to aid in code readability, mainly for debugging/testing use
// cases.
//
// Warning: While the Time subclass has a fixed origin point, the origin for
// the other subclasses can vary each time the application is restarted.
//   since_origin(): TimeDelta

  ASSIGN(other: TimeBase): TimeBase {
    this.us_ = other.us_;
    return (this);
  }

  // Return a new time modified by some delta.
  ADD(delta: TimeDelta): TimeBase {
    return new TimeBase(this.us_ + delta.InMicroseconds());
  }

  SUB(delta: TimeBase): TimeDelta
  SUB(delta: TimeDelta): TimeBase
  SUB(delta: unknown): unknown {
    if (delta instanceof TimeBase) {
      return Microseconds(this.us_ - delta.us_);
    } else if (delta instanceof TimeDelta) {
      return new TimeBase((Microseconds(this.us_).ADD(delta)).InMicroseconds());
    }
    NOTREACHED();
  }

  // Modify by some time delta.
  ADD_ASSIGN(delta: TimeDelta): TimeBase {
    return this.ASSIGN(this.ADD(delta));
  }
  SUB_ASSIGN(delta: TimeDelta) {
    return this.ASSIGN(this.SUB(delta));
  }

  // Comparison operators
  EQ(other: TimeBase): boolean { return this.us_ == other.us_; }
  NE(other: TimeBase): boolean { return this.us_ != other.us_; }
  LT(other: TimeBase): boolean { return this.us_ < other.us_; }
  LE(other: TimeBase): boolean { return this.us_ <= other.us_; }
  GT(other: TimeBase): boolean { return this.us_ > other.us_; }
  GE(other: TimeBase): boolean { return this.us_ >= other.us_; }
}

// Time -----------------------------------------------------------------------

// Represents a wall clock time in UTC. Values are not guaranteed to be
// monotonically non-decreasing and are subject to large amounts of skew.
// Time is stored internally as microseconds since the Windows epoch (1601).
export class Time extends TimeBase {

}

// Represents monotonically non-decreasing clock time.
export class TimeTicks extends TimeBase {
  // Platform-dependent tick count representing "right now." When
  // IsHighResolution() returns false, the resolution of the clock could be
  // as coarse as ~15.6ms. Otherwise, the resolution should be no worse than one
  // microsecond.
  static Now(): TimeTicks {
    return new TimeTicks(Date.now());
  }
}

