import type { Rasterizer } from './rasterizer/rasterizer';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { Rect } from '../math/rect';
import { TimeDelta, TimeTicks } from '@neditor/core/base/time/time';
import { Node } from '../render_tree/node';
import { Submission, TimelineInfo } from './submission';
import { SubmissionQueue } from './submission_queue';
import { DCHECK } from '@neditor/core/base/check';
import { RepeatingTimer } from '@neditor/core/base/timer/timer';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { ResourceProvider } from '../render_tree/resource_provider';
import { Surface } from '@neditor/skia';

// How quickly the renderer time adjusts to changing submission times.
// 500ms is chosen as a default because it is fast enough that the user will not
// usually notice input lag from a slow timeline renderer, but slow enough that
// quick updates while a quick animation is playing should not jank.
const kTimeToConvergeInMS = 500.0;

// Pipeline is a thread-safe class that setups up a rendering pipeline
// for processing render trees through a rasterizer.  New render trees are
// submitted to the pipeline, from any thread, by calling Submit().  This
// pushes the submitted render tree through a rendering pipeline that eventually
// results in the render tree being submitted to the passed in rasterizer which
// can output the render tree to the display.  A new thread is created which
// hosts the rasterizer submit calls.  Render trees are rasterized as fast
// as the rasterizer will accept them, which is likely to be the display's
// refresh rate.
export class Pipeline {
  // Using the provided rasterizer creation function, a rasterizer will be
  // created within the Pipeline on a separate rasterizer thread.  Thus,
  // the rasterizer created by the provided function should only reference
  // thread safe objects.  If |clear_to_black_on_shutdown| is specified,
  // the provided render_target_ (if not NULL) will be cleared to black when
  // the pipeline is destroyed.
  constructor(
    rasterizer: Rasterizer,
    render_target: Surface,
    submit_even_if_render_tree_is_unchanged: boolean,
  ) {
    TRACE_EVENT0('cobalt::renderer', 'Pipeline::Pipeline()');
    this.render_target_ = render_target;
    this.submit_even_if_render_tree_is_unchanged_ = submit_even_if_render_tree_is_unchanged;
    this.last_did_rasterize_ = false;
    this.new_render_tree_rasterize_count_ = 0;
    this.new_render_tree_rasterize_time_ = 0;
    this.has_active_animations_c_val_ = false;
    this.animations_start_time_ = 0;
    this.animations_end_time_ = 0;
    this.fallback_rasterize_count_ = 0;
    this.rasterizer_ = rasterizer;
    this.InitializeRasterizerThread();
  }

  // Submit a new render tree to the renderer pipeline.  After calling this
  // method, the submitted render tree will be the one that is continuously
  // animated and rendered by the rasterizer.
  Submit(render_tree_submission: Submission) {
    TRACE_EVENT0('cobalt::renderer', 'Pipeline::Submit()');

    // Execute the actual set of the new render tree on the rasterizer tree.
    this.SetNewRenderTree(render_tree_submission);
  }

  // Clears the currently submitted render tree submission and waits for the
  // pipeline to be flushed before returning.
  Clear() {
    TRACE_EVENT0('cobalt::renderer', 'Pipeline::Clear()');
    this.ClearCurrentRenderTree();
  }

  // |render_tree_submission| will be rasterized into a new offscreen surface.
  // The RGBA pixel data will be extracted from this surface, and |complete|
  // will be called with the pixel data and the dimensions of the image.
  // void RasterizeToRGBAPixels(
  //     const scoped_refptr<render_tree::Node>& render_tree_root,
  //     const base::Optional<math::Rect>& clip_rect,
  //     const RasterizationCompleteCallback& complete);

  // Returns a thread-safe object from which one can produce renderer resources
  // like images and fonts which can be referenced by render trees that are
  // subsequently submitted to this pipeline.
  GetResourceProvider(): ResourceProvider {
    return this.rasterizer_?.GetResourceProvider()!;
  }

  // All private data members should be accessed only on the rasterizer thread,
  // with the exception of rasterizer_thread_ itself through which messages
  // are posted.

  // Called by Submit() to do the work of actually setting the newly submitted
  // render tree.  This method will be called on the rasterizer thread.
  private SetNewRenderTree(render_tree_submission: Submission) {
    DCHECK(render_tree_submission.render_tree);

    TRACE_EVENT0('cobalt::renderer', 'Pipeline::SetNewRenderTree()');

    this.QueueSubmission(render_tree_submission, TimeTicks.Now());

    this.RasterizeCurrentTree();
  }

  // Clears the current render tree and calls the callback when this is done.
  private ClearCurrentRenderTree() {
    TRACE_EVENT0('cobalt::renderer', 'Pipeline::ClearCurrentRenderTree()');
    this.ResetSubmissionQueue();
    this.rasterize_timer_ = undefined;
  }

  // Called repeatedly (the rate is limited by the rasterizer, so likely it
  // will be called every 1/60th of a second) on the rasterizer thread and
  // results in the rasterization of the current tree and submission of it to
  // the render target.
  private RasterizeCurrentTree() {
    TRACE_EVENT0('cobalt::renderer', 'Pipeline::RasterizeCurrentTree()');

    let start_rasterize_time = TimeTicks.Now();
    let submission = this.submission_queue_!.GetCurrentSubmission(start_rasterize_time);

    let is_new_render_tree = submission.render_tree != this.last_render_tree_;
    let has_render_tree_changed = is_new_render_tree;
    let force_rasterize =
      this.submit_even_if_render_tree_is_unchanged_;

    let maximum_frame_interval_milliseconds = -1.0;
    if (maximum_frame_interval_milliseconds >= 0.0) {
      let max_time_between_rasterize = TimeDelta.FromMilliseconds(maximum_frame_interval_milliseconds);
      if (start_rasterize_time.SUB(this.last_rasterize_time_!).GT(max_time_between_rasterize)) {
        force_rasterize = true;
      }
    }

    // If our render tree hasn't changed from the one that was previously
    // rendered and it's okay on this system to not flip the display buffer
    // frequently, then we can just not do anything here.
    if (force_rasterize || has_render_tree_changed) {
      // Check whether the animations in the render tree that is being rasterized
      // are active.
      // render_tree::animations::AnimateNode* animate_node =
      //   base::polymorphic_downcast<render_tree::animations::AnimateNode*>(
      //     submission.render_tree.get());

      // Rasterize the last submitted render tree.
      let did_rasterize = this.RasterizeSubmissionToRenderTarget(
        submission, this.render_target_, force_rasterize);
      if (did_rasterize) {
        this.last_rasterize_time_ = start_rasterize_time;
      }

      // let animations_expired = animate_node.expiry() <= submission.time_offset;
      // let stat_tracked_animations_expired = animate_node.depends_on_time_expiry() <= submission.time_offset;

      let animations_expired = true;
      let stat_tracked_animations_expired = true;

      this.last_did_rasterize_ = did_rasterize;
    }
  }

  // Rasterize the animated |render_tree_submission| to |render_target|,
  // applying the time_offset in the submission to the animations.
  // Returns true only if a rasterization actually took place.
  private RasterizeSubmissionToRenderTarget(
    submission: Submission,
    render_target: Surface,
    force_rasterize: boolean): boolean {
    TRACE_EVENT0('cobalt::renderer',
      'Pipeline::RasterizeSubmissionToRenderTarget()');

    // Keep track of the last render tree that we rendered so that we can watch
    // if it changes, in which case we should reset our tracked
    // |previous_animated_area_|.
    if (submission.render_tree != this.last_render_tree_) {
      this.last_render_tree_ = submission.render_tree;
      // this.last_animated_render_tree_ = undefined
      // this.previous_animated_area_ = undefined
      // this.last_render_time_ = undefined;
    }

    // Animate the render tree using the submitted animations.
    // render_tree::animations::AnimateNode * animate_node =
    //   last_animated_render_tree_
    //     ? last_animated_render_tree_.get()
    //     : base::polymorphic_downcast < render_tree::animations::AnimateNode * > (
    //     submission.render_tree.get());

    // Some animations require a GL graphics context to be current.  Specifically,
    // a call to SbPlayerGetCurrentFrame() may be made to get the current video
    // frame to drive a video-as-an-animated-image.
    // rasterizer::Rasterizer::ScopedMakeCurrent scoped_make_current(
    //   rasterizer_.get());
    //
    // render_tree::animations::AnimateNode::AnimateResults results =
    //   animate_node.Apply(submission.time_offset);
    //
    // if (results.animated == last_animated_render_tree_ && !force_rasterize) {
    //   return false;
    // }
    // last_animated_render_tree_ = results.animated;

    // Calculate a bounding box around the active animations.  Union it with the
    // bounding box around active animations from the previous frame, and we get
    // a scissor rectangle marking the dirty regions of the screen.
    // math::RectF animated_bounds = results.get_animation_bounds_since.Run(
    //   last_render_time_ ? *last_render_time_ : base::TimeDelta());
    // math::Rect rounded_bounds = math::RoundOut(animated_bounds);
    // base::Optional<math::Rect> redraw_area;
    // if (previous_animated_area_) {
    //   redraw_area = math::UnionRects(rounded_bounds, *previous_animated_area_);
    // }
    // previous_animated_area_ = rounded_bounds;

    let submit_tree = submission.render_tree;

    // Rasterize the animated render tree.
    // rasterizer::Rasterizer::Options rasterizer_options;
    // rasterizer_options.dirty = redraw_area;
    this.rasterizer_!.Submit(submit_tree, render_target);

    // Run all of this submission's callbacks.
    for (let callback of submission.on_rasterized_callbacks) {
      callback();
    }

    submit_tree.dispose();

    return true;
  }

  // This method is executed on the rasterizer thread and is responsible for
  // constructing the rasterizer.
  private InitializeRasterizerThread() {
    // TRACE_EVENT0('cobalt::renderer', 'Pipeline::InitializeRasterizerThread');

    // Async load additional fonts after rasterizer thread is fully initialized.
    // GetResourceProvider().LoadAdditionalFonts();

    // Note that this is setup as high priority, but lower than the rasterizer
    // thread's priority (ThreadPriority::HIGHEST).  This is to ensure that
    // we never interrupt the rasterizer in order to dispose render trees, but
    // at the same time we do want to prioritize cleaning them up to avoid
    // large queues of pending render tree disposals.

    this.ResetSubmissionQueue();
  }

  // Shuts down the submission queue.  This is done on the rasterizer thread
  // and is separate from general shutdown because clearing out the submission
  // queue may result in tasks being posted to the rasterizer thread (e.g.
  // texture deletions).
  // void ShutdownSubmissionQueue();

  // This method is executed on the rasterizer thread to shutdown anything that
  // needs to be shutdown from there.
  // void ShutdownRasterizerThread();

  // This method releases the rasterizer. This is exposed separately from
  // ShutdownRasterizerThread() so it can be executed after tasks that may
  // be posted by ShutdownRasterizerThread().
  // void ShutdownRasterizer() { rasterizer_.reset(); }

  OnDumpCurrentRenderTree(str: string): void {
  }

  FrameStatsOnFlushCallback(): void {

  }

  // Resets the submission queue, effectively emptying it and restarting it
  // with the configuration specified by |current_timeline_info_| applied to it.
  private ResetSubmissionQueue() {
    TRACE_EVENT0('cobalt::renderer', 'Pipeline::ResetSubmissionQueue()');
    this.submission_queue_ = new SubmissionQueue(
      this.current_timeline_info_.max_submission_queue_size,
      TimeDelta.FromMilliseconds(kTimeToConvergeInMS),
      this.current_timeline_info_.allow_latency_reduction,
      (submission: Submission) => {
        submission.dispose();
      }
    );
  }

  // Pushes the specified submission into the submission queue, where it will
  // then be picked up by subsequent rasterizations.  If the submission's
  // timeline id is different from the current timeline id (in
  // |current_timeline_info_|), then the submission queue will be reset.
  private QueueSubmission(submission: Submission, receipt_time: TimeTicks): void {
    TRACE_EVENT0('cobalt::renderer', 'Pipeline::QueueSubmission()');
    // Upon each submission, check if the timeline has changed.  If it has,
    // reset our submission queue (possibly with a new configuration specified
    // within |timeline_info|.
    // if (submission.timeline_info.id != this.current_timeline_info_.id) {
    //   this.current_timeline_info_ = submission.timeline_info;
    //   this.ResetSubmissionQueue();
    // }

    DCHECK(this.submission_queue_);
    this.submission_queue_!.PushSubmission(submission, receipt_time);
  }

  // base::WaitableEvent rasterizer_created_event_;

  // The render_target that all submitted render trees will be rasterized to.
  private render_target_: Surface;

  // backend::GraphicsContext* graphics_context_;

  // A timer that signals to the rasterizer to rasterize the next frame.
  // The timer is setup with a period of 0ms so that it will submit as fast
  // as possible, it is up to the rasterizer to pace the pipeline.  The timer
  // is used to manage the repeated posting of the rasterize task call and
  // to make proper shutdown easier.
  private rasterize_timer_?: RepeatingTimer;

  // The thread that all rasterization will take place within.
  // base::Thread rasterizer_thread_;

  // The rasterizer object that will run on the rasterizer_thread_ and is
  // effectively the last stage of the pipeline, responsible for rasterizing
  // the final render tree and submitting it to the render target.
  private rasterizer_?: Rasterizer;

  // A thread whose only purpose is to destroy submissions/render trees.
  // This is important because destroying a render tree can take some time,
  // and we would like to avoid spending this time on the renderer thread.
  // base::Thread submission_disposal_thread_;

  // Manages a queue of render tree submissions that are to be rendered in
  // the future.
  private submission_queue_?: SubmissionQueue;

  // If true, we will submit the current render tree to the rasterizer every
  // frame, even if it hasn't changed.
  private submit_even_if_render_tree_is_unchanged_: boolean;

  // Keeps track of the last rendered animated render tree.
  private last_render_tree_?: Node;

  // scoped_refptr<render_tree::animations::AnimateNode>
  //     last_animated_render_tree_;

  // The submission time used during the last render tree render.
  // private last_render_time_?: TimeDelta;

  // Did a rasterization take place in the last frame?
  private last_did_rasterize_: boolean;

  // Timer tracking the amount of time spent in
  // |RasterizeSubmissionToRenderTarget| while animations are active. The
  // tracking is flushed when the animations expire.
  // base::CValCollectionTimerStats<base::CValPublic> rasterize_animations_timer_;

  // Accumulates render tree rasterization interval times but does not flush
  // them until the maximum number of samples is gathered.
  // base::CValCollectionTimerStats<base::CValPublic>
  //     rasterize_periodic_interval_timer_;

  // Timer tracking the amount of time between calls to
  // |RasterizeSubmissionToRenderTarget| while animations are active. The
  // tracking is flushed when the animations expire.
  // base::CValCollectionTimerStats<base::CValPublic>
  //     rasterize_animations_interval_timer_;

  // The total number of times Skia was used to render
  // a non-text render tree node.
  private fallback_rasterize_count_: number;

  // The total number of new render trees that have been rasterized.
  private new_render_tree_rasterize_count_: number;
  // The last time that a newly encountered render tree was first rasterized.
  private new_render_tree_rasterize_time_: number;

  // Whether or not animations are currently playing.
  private has_active_animations_c_val_: boolean;
  // The most recent time animations started playing.
  private animations_start_time_: number;
  // The most recent time animations ended playing.
  private animations_end_time_: number;

  private post_fence_submission_?: Submission;
  private post_fence_receipt_time_?: TimeTicks;

  // Information about the current timeline.  Each incoming submission
  // identifies with a particular timeline, and if that ever changes, we assume
  // a discontinuity in animations and reset our submission queue, possibly
  // with new configuration parameters specified in the new |TimelineInfo|.
  private current_timeline_info_: TimelineInfo = new TimelineInfo();

  // This timestamp represents the last time the pipeline rasterized a
  // render tree to render_target_. This is different from last_render_time_
  // which is specific to the current submission and is reset whenever a new
  // render tree is submitted.
  private last_rasterize_time_?: TimeTicks;
}
