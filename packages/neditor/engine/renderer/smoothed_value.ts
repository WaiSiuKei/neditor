// Smooths a value over time.  Currently implemented using bezier curve.
import { TimeDelta, TimeTicks } from '@neditor/core/base/time/time';
import { DCHECK } from '@neditor/core/base/check';
import { isNil } from '@neditor/core/base/common/type';
import { DCHECK_LE } from '@neditor/core/base/check_op';

export class SmoothedValue {
  // |time_to_converge| indicates how long it takes for the current value
  // to converge to a newly set target value.  A |max_slope_magnitude| can
  // be provided to dictate the maximum slope the value will move by as it
  // transitions from one value to another.  It must be greater than 0, if
  // provided, and it can result in convergence times larger than
  // |time_to_converge|.
  constructor(
    time_to_converge: TimeDelta,
    max_slope_magnitud?: number
  ) {
    this.time_to_converge_ = time_to_converge;
    this.previous_derivative_ = 0;
    this.max_slope_magnitude_ = max_slope_magnitud;
    DCHECK((new TimeDelta(0)).LT(this.time_to_converge_));
    DCHECK(isNil(this.max_slope_magnitude_) || this.max_slope_magnitude_ > 0);
  }

  // Sets the target value that GetCurrentValue() will smoothly converge
  // towards.
  SetTarget(target: number, time: TimeTicks) {
    // Determine the current derivative and value.
    let current_derivative = this.GetCurrentDerivative(time);
    let current_value: number;
    if (this.target_) {
      current_value = this.GetValueAtTime(time);
    }

    // Set the previous derivative and value to the current derivative and value.
    this.previous_derivative_ = current_derivative;
    this.previous_value_ = current_value!;

    this.target_ = target;
    this.target_set_time_ = time;
  }

  // Snaps GetCurrentValue() to the last set target value.
  SnapToTarget() {
    this.previous_value_ = undefined;
    this.previous_derivative_ = 0;
  }

  // Returns the current value, which is always converging slowly towards
  // the last set target value.
  GetValueAtTime(time: TimeTicks): number {
    if (!this.previous_value_) {
      // If only one target has ever been set, simply return it.
      return this.target_!;
    }

    // Compute the current value based off of a cubic bezier curve.
    let t = this.t(time);
    let one_minus_t = 1 - t;
    let P0 = this.P0();
    let P1 = this.P1();
    let P2 = this.P2();
    let P3 = this.P3();

    return one_minus_t * one_minus_t * one_minus_t * P0 +
      3 * one_minus_t * one_minus_t * t * P1 + 3 * one_minus_t * t * t * P2 +
      t * t * t * P3;
  }

  // The following methods return the parameters for the cubic bezier equation.
  //   https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B.C3.A9zier_curves

  // Returns the value of t to be used in cubic bezier equations.
  private t(time: TimeTicks): number {
    DCHECK(this.target_, 'SetTarget() must have been called previously.');

    let time_diff = time.SUB(this.target_set_time_!);
    let time_to_converge_in_seconds = this.time_to_converge_.InSeconds();

    // Enforce any maximum slope constraints (which can result in overriding the
    // time to converge).
    if (this.max_slope_magnitude_) {
      let largest_slope = this.GetDerivativeWithLargestMagnitude();
      if (largest_slope == Number.POSITIVE_INFINITY ||
        largest_slope == Number.NEGATIVE_INFINITY) {
        // If we can have a slope of infinity, then just don't move.
        return 0;
      }

      // If we find that our smoothing curve's maximum slope would result in a
      // slope greater than the maximum slope constraint, stretch the time to
      // converge in order to meet the slope constraint.  This can result in
      // overriding the user-provided time to converge.
      let unconstrained_largest_slope =
        largest_slope / time_to_converge_in_seconds;
      if (unconstrained_largest_slope < -this.max_slope_magnitude_) {
        time_to_converge_in_seconds = -largest_slope / this.max_slope_magnitude_;
      } else if (unconstrained_largest_slope > this.max_slope_magnitude_) {
        time_to_converge_in_seconds = largest_slope / this.max_slope_magnitude_;
      }
    }

    let t = time_diff.InSeconds() / time_to_converge_in_seconds;

    DCHECK_LE(0, t);

    return Math.max(Math.min(t, 1.0), 0.0);
  }

  private P0(): number { return this.previous_value_!; }

  // Returns the value of P1 to be used in cubic bezier equations.
  // Here, we calculate it from |previous_derivative_| and |previous_value_|
  // in such a way that it results in a curve that at t = 0 has a derivative
  // equal to |previous_derivative_|.
  private P1(): number {
    // See comments in header for why P1() is calculated this way.
    return this.previous_value_! + this.previous_derivative_ / 3.0;
  }

  // Returns the value of P2 to be used in cubic bezier equations.
  // For us, we set it in such a way that the derivative at t = 1 is 0.
  private P2(): number {
    // See comments in header for why P2() is calculated this way.
    return this.P3();
  }

  private P3(): number { return this.target_!; }

  // Returns the current derivative of GetCurrentValue() over time.
  private GetCurrentDerivative(time: TimeTicks): number {
    if (!this.previous_value_) {
      // If only one target has ever been set, return 0 as our derivative.
      return 0;
    }

    let t = this.t(time);
    let P0 = this.P0();
    let P1 = this.P1();
    let P2 = this.P2();
    let P3 = this.P3();

    return EvaluateCubicBezierDerivative(P0, P1, P2, P3, t);
  }

  // Returns the derivative of the function that has the highest magnitude
  // between 0 and 1.
  private GetDerivativeWithLargestMagnitude(): number {
    let P0 = this.P0();
    let P1 = this.P1();
    let P2 = this.P2();
    let P3 = this.P3();

    // Since our spline is a cubic function, it will have a single inflection
    // point where its derivative is 0 (or infinite if
    // numerator = denominator = 0).  This function finds that single inflection
    // point and stores the value in |t|.  We then evaluate the derivative at
    // that inflection point, and at the beginning and end of the [0, 1] segment.
    // We then compare the results and return the derivative with the largest
    // magnitude.

    // Compute the location of the inflection point by setting the second
    // derivative to zero and solving.
    let numerator = (P2 - 2 * P1 + P0);
    let denominator = (-P3 + 3 * P2 - 3 * P1 + P0);
    let t;
    if (numerator == 0) {
      t = 0;
    } else if (denominator == 0.0) {
      return numerator >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else {
      t = numerator / denominator;
    }

    // Evaluate the value of the derivative at each critical point.
    let at_inflection_point = EvaluateCubicBezierDerivative(P0, P1, P2, P3, t);
    let at_start = EvaluateCubicBezierDerivative(P0, P1, P2, P3, 0);
    let at_end = EvaluateCubicBezierDerivative(P0, P1, P2, P3, 1);

    if (Math.abs(at_inflection_point) > Math.abs(at_start)) {
      if (Math.abs(at_inflection_point) > Math.abs(at_end)) {
        return at_inflection_point;
      } else {
        return at_end;
      }
    } else {
      if (Math.abs(at_start) > Math.abs(at_end)) {
        return at_start;
      } else {
        return at_end;
      }
    }
  }

  private time_to_converge_: TimeDelta;

  // The current target value that we are converging towards.
  private target_?: number;

  // Tracks when |target_| was last set.
  private target_set_time_?: TimeTicks;

  // The value returned by GetCurrentValue() at the time that the target was
  // last set.
  private previous_value_?: number;

  // The derivative of GetCurrentValue() when target was last set.
  private previous_derivative_: number;

  private max_slope_magnitude_?: number;
};

function EvaluateCubicBezierDerivative(
  P0: number,
  P1: number,
  P2: number,
  P3: number,
  t: number): number {
  let one_minus_t = 1 - t;
  return 3 * one_minus_t * one_minus_t * (P1 - P0) +
    6 * one_minus_t * t * (P2 - P1) + 3 * t * t * (P3 - P2);
}
