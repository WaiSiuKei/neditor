// The submission queue encapsulates the logic behind selecting which
// of the recent render tree submissions should be used to render at any
// given time, and what time offset should be used to render them at.  It
// manages smoothing between submissions whose animations have differing time
// offsets.
//
// As an example, consider the following timelines.  Assume that a layout engine
// is producing submissions, and the top timeline represents the layout engine's
// time.  To maintain generality, we will call this the submission timeline.
// The bottom timeline is the renderer timeline.
//
//  Submission Timeline
//
//  {} ----A------------------B------------C--------------------------D-------.
//    .     \                  \            \                          \       .
//    .      ---------          ---------    \                          \      .
//    .               \                  \    \                          \     .
//  () ----------------aA-----------------bB---c--------C-----------------d-D-.
//
//  Renderer Timeline
//
// In the diagram above, {X} represents the event that submission X was
// created with the specified designated submission timeline time.  Event (x)
// represents that the renderer received submission X at the specified renderer
// timeline time.  Event (X) represents that the renderer displayed submission
// X at the specified time.
//
// Ideally, we would like to keep the time spacing between subsequent (X) events
// equal to the spacing between subsequent {X} events.  Note that when the first
// submission arrives at the renderer, event (a), we can display it right away
// since it is the first submission and no spacing has been established yet.
//
// Next, we see that the spacing between {B} and (b) is equal to the spacing
// between {A} and (a), so we can display (B) immediately (like we did with (A))
// as well.
//
// When (c) occurs however, we see that it took much less time for the renderer
// to receive the submission, (c), since it was created, {C}.  This may happen
// if for example a layout engine performed a relatively quick layout to produce
// submission C.  In order to maintain a similar distance between {C} and
// (C) as we saw for {B} and (B), we must delay rendering submission C for a
// bit.  In this case, we store submission C in the queue and only display it
// when the time is right, at which point we also purge the old submission B.
//
// If we find that the time between {X} and (x) is consistently small, we would
// like to start showing (X) sooner since the longer we wait to display it,
// the larger the input lag.  Thus, as time goes on we slowly change our wait
// time between {X} and (X) to match the last seen time difference between {X}
// and (x).  In the case above, we see that when (d) arrives, because submission
// C had previously established a faster response time, and D is similar, we
// are able to show (D) almost right away.
//
// In the code below, the set target value of |to_submission_time_in_ms_|
// represents the time difference {X} - (x).  This value is represented by the
// vertical lines in the diagram above.  The smoothed value of
// |to_submission_time_in_ms_| (or in other words,
// |to_submission_time_in_ms_.GetCurrentValue()|) is the time difference
// {X} - (X) that slowly and smoothly is always moving towards the target,
// {X} - (x).
//

import { TimeDelta, TimeTicks } from '@neditor/core/base/time/time';
import { Submission } from './submission';
import { SmoothedValue } from './smoothed_value';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { DCHECK } from '@neditor/core/base/check';
import { DCHECK_GE } from '@neditor/core/base/check_op';
import { NOTREACHED } from '@neditor/core/base/common/notreached';

type DisposeSubmissionFunction = (sub: Submission) => void

// The maximum change (in units of ms/s) of to_submission_time_in_ms_.  This
// value must be less than 1000ms/s, or else it might be possible to adjust
// our render time/submission time offset by less than -1 second per second,
// meaning that we would move backwards in time.  We keep this at a healthy
// value of 800ms.  This also acts as a crude form of regularization.
const kMaxSlopeMagnitude = 800.0;

export class SubmissionQueue {

  // |max_queue_size| indicates the maximum size of the submission queue.  If
  // a new submission is pushed which would increase the queue size to its
  // maximum, we drop the oldest submission and snap to the time of the next
  // one.  It provides a bound on the number of intermediate submissions, and
  // so, memory.
  // |time_to_converge| is a time value that indicates how long each transition
  // between time values will take.
  // |dispose_function| specifies a function that will be called and
  // passed a Submission that the submission queue is done with.  This may be
  // used to allow the Submission/render tree to be disposed/destroyed on a
  // separate thread.
  constructor(
    max_queue_size: number,
    time_to_converge: TimeDelta,
    allow_latency_reduction: boolean = true,
    dispose_function?: DisposeSubmissionFunction
  ) {
    this.max_queue_size_ = max_queue_size;
    this.dispose_function_ = dispose_function;
    this.allow_latency_reduction_ = allow_latency_reduction;
  }

  // Pushes a new submission into the submission queue, possibly updating
  // internal timing parameters based on the submission's time offset.
  PushSubmission(submission: Submission, now: TimeTicks) {
    TRACE_EVENT0('cobalt::renderer', 'SubmissionQueue::PushSubmission()');

    if (this.submission_queue_.length >= this.max_queue_size_) {
      // If we are at capacity, then make room for the new submission by erasing
      // our first element.
      this.submission_queue_.shift();
    }

    // Save the new submission.
    this.submission_queue_.unshift(submission);

    // Possibly purge old stale submissions.
    this.PurgeStaleSubmissionsFromQueue(now);
  }

  // For the current time, returns a submission to be used for rendering, with
  // timing information already setup.  Time must be monotonically increasing.
  GetCurrentSubmission(now: TimeTicks): Submission {
    TRACE_EVENT0('cobalt::renderer', 'SubmissionQueue::GetCurrentSubmission()');

    DCHECK(this.submission_queue_.length > 0);

    // First get rid of any stale submissions from our queue.
    this.PurgeStaleSubmissionsFromQueue(now);

    // Create a new submission with an updated time offset to account for the
    // fact that time has passed since it was submitted.
    let updated_time_submission = this.submission_queue_[0];

    return updated_time_submission;
  }

  private PurgeStaleSubmissionsFromQueue(time: TimeTicks): void {
    TRACE_EVENT0('cobalt::renderer',
      'SubmissionQueue::PurgeStaleSubmissionsFromQueue()');
    if (this.submission_queue_.length > 1) {
      this.submission_queue_.length = 1;
    }
  }

  // The maximum size of the queue.  If we go over this, we snap time forward.
  private max_queue_size_: number;

  // Function to call before releasing a handle on a render tree.
  private dispose_function_?: DisposeSubmissionFunction;

  // An arbitrary time chosen upon construction to fully specify the renderer
  // timeline.  The first time |render_time(t)| is called, this will be set
  // to |t| such that the first time it is called, |render_time(t)| will return
  // 0.  Theoretically, its actual value doesn't really matter, but this method
  // keeps the origin on the same order as the current clock values in order
  // to avoid the chance of floating point error.
  private renderer_time_origin_?: TimeTicks;

  // The queue of submissions, sorted in ascending order of times.
  private submission_queue_: Submission[] = [];

  // A good way to think of this value is that adding it to render_time() gives
  // you a time on the source (e.g. the submissions) timeline.  So, for example,
  // to see if an incoming submission time, s, is in the renderer's past, you
  // could check if
  //   base::TimeTicks now = base::TimeTicks::Now();
  //   s.time_offset - render_time(now) <
  //       base::TimeDelta::FromMillisecondsD(
  //           to_submission_time_in_ms_.GetCurrentValue(now))
  // is true.
  // Debug value to help DCHECK that input |now| values are monotonically
  // increasing.
  // private last_now_?: TimeTicks;

  // private to_submission_time_cval_: TimeDelta;

  // If false, we will only ever allow to_submission_time_cval_ to move
  // backwards ensuring that animations never speed up during playback (at the
  // cost of increased and non-recoverable input latency).  This is good for
  // non-interactive content.
  private allow_latency_reduction_: boolean;
};
