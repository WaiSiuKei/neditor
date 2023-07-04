import { Node } from '../render_tree/node';

// A package of all information associated with a render tree submission.
import { TimeDelta } from '@neditor/core/base/time/time';
import { Disposable } from "../../base/common/lifecycle";

export class Submission extends Disposable {
  // Convenience constructor that assumes there are no animations and sets up
  // an empty animation map.
  constructor(render_tree: Node, time_offset: TimeDelta = new TimeDelta(0)) {
    super()
    this.render_tree = render_tree;
    this.time_offset = time_offset;
  }

  // Submit a render tree as well as associated animations.  The
  // time_offset parameter indicates a time that will be used to offset all
  // times passed into animation functions.
  // Submission(scoped_refptr<render_tree::Node> render_tree,
  //            base::TimeDelta time_offset)
  //     : render_tree(render_tree), time_offset(time_offset) {}

  // Maintains the current render tree that is to be rendered next frame.
  render_tree: Node;

  // The time from some origin that the associated render tree animations were
  // created.  This permits the render thread to compute times relative
  // to the same origin when updating the animations, as well as hinting
  // at the latency between animation creation and submission to render
  // thread.
  time_offset: TimeDelta;

  // All callbacks within the vector will be called every time this submission
  // is rasterized.
  on_rasterized_callbacks: Function[] = [];

  timeline_info: TimelineInfo = new TimelineInfo();
};

// Information about the specific timeline that this submission is intended
// to run on.  The most important part of TimelineInfo is TimelineInfo::id,
// which the renderer pipeline will check to see if it is equal to the
// submissions timeline, and if so assume animation continuity.  If not, it
// will reset its submission queue, and possibly apply any animation playback
// configuration changes specified by the other fields in this structure.
export class TimelineInfo {
  // An id of -1 is valid, and acts as the default id.
  constructor(
    // A number identifying this timeline and used to check for timeline
    // continuity between submissions.  If this changes, the renderer pipeline
    // will reset its submission queue.
    public id = -1,
    // If true, allows the vector from renderer time to submission time to
    // increase over time, in effect reducing latency between when a submission
    // is submitted to when it appears on the screen.  This is typically
    // desirable for interactive applications, but not as necessary for
    // non-interactive content (and in this case can result in some frames
    // being skipped).
    public allow_latency_reduction = true,
    // In order to put a bound on memory we set a maximum submission queue size.
    // The queue size refers to how many submissions which the renderer has
    // not caught up to rendering yet will be stored.  If latency reduction
    // is disallowed, this will likely need to be higher to accommodate for
    // the larger latency between submission and render.
    public max_submission_queue_size = 4
  ) {
  }
};
