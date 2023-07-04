import { CHECK, DCHECK } from '@neditor/core/base/check';
import { RuntimeEnabledFeatures } from '@neditor/core/platform/runtime_enabled_features';
import { DCHECK_GT } from '@neditor/core/base/check_op';

export enum LifecycleState {
  kUninitialized,
  kInactive,

  // When the document is active, it traverses these states.

  kVisualUpdatePending,

  kInStyleRecalc,
  kStyleClean,

  kInPerformLayout,
  kAfterPerformLayout,
  kLayoutClean,

  // In InAccessibility step, fire deferred accessibility events which
  // require layout to be in a clean state.
  kInAccessibility,
  kAccessibilityClean,

  kInCompositingInputsUpdate,
  kCompositingInputsClean,

  // In InPrePaint step, any data needed by painting are prepared.
  // Paint property trees are built and paint invalidations are issued.
  kInPrePaint,
  kPrePaintClean,

  kInCompositingAssignmentsUpdate,
  kCompositingAssignmentsClean,

  // In InPaint step, paint artifacts are generated and raster invalidations
  // are issued.
  // In CAP, composited layers are generated/updated.
  kInPaint,
  kPaintClean,

  // Once the document starts shutting down, we cannot return
  // to the style/layout/compositing states.
  kStopping,
  kStopped,
};

// class Scope {
//   STACK_ALLOCATED();
//
//   public:
//     Scope(DocumentLifecycle&, LifecycleState final_state);
//   Scope(const Scope&) = delete;
//   Scope& operator=(const Scope&) = delete;
// ~Scope();
//
//   private:
//     DocumentLifecycle& lifecycle_;
//   LifecycleState final_state_;
// };

// class DeprecatedTransition {
//   DISALLOW_NEW();
//
//   public:
//     DeprecatedTransition(LifecycleState from, LifecycleState to);
//   DeprecatedTransition(const DeprecatedTransition&) = delete;
//   DeprecatedTransition& operator=(const DeprecatedTransition&) = delete;
// ~DeprecatedTransition();
//
//   LifecycleState From() const { return from_; }
// LifecycleState To() const { return to_; }
//
// private:
// DeprecatedTransition* previous_;
// LifecycleState from_;
// LifecycleState to_;
// };

// Within this scope, state transitions are not allowed.
// Any attempts to advance or rewind will result in a DCHECK.
// class DisallowTransitionScope {
//   STACK_ALLOCATED();
//
//   public:
//     explicit DisallowTransitionScope(DocumentLifecycle& document_lifecycle)
// : document_lifecycle_(document_lifecycle) {
//     document_lifecycle_.IncrementNoTransitionCount();
//   }
//   DisallowTransitionScope(const DisallowTransitionScope&) = delete;
//   DisallowTransitionScope& operator=(const DisallowTransitionScope&) = delete;
//
// ~DisallowTransitionScope() {
//     document_lifecycle_.DecrementNoTransitionCount();
//   }
//
//   private:
//     DocumentLifecycle& document_lifecycle_;
// };

// class DetachScope {
//   STACK_ALLOCATED();
//
//   public:
//     explicit DetachScope(DocumentLifecycle& document_lifecycle)
// : document_lifecycle_(document_lifecycle) {
//     document_lifecycle_.IncrementDetachCount();
//   }
//   DetachScope(const DetachScope&) = delete;
//   DetachScope& operator=(const DetachScope&) = delete;
//
// ~DetachScope() { document_lifecycle_.DecrementDetachCount(); }
//
//   private:
//     DocumentLifecycle& document_lifecycle_;
// };

// class CheckNoTransitionScope {
//   STACK_ALLOCATED();
//
//   public:
//     explicit CheckNoTransitionScope(DocumentLifecycle& document_lifecycle)
// : auto_reset_(&document_lifecycle.check_no_transition_, true) {}
//
// private:
// base::AutoReset<bool> auto_reset_;
// };

// If we hit a devtool break point in the middle of document lifecycle, for
// example, https://crbug.com/788219, this scope is triggered and no more
// layout or style computation is allowed.
// This class should never be used outside of debugging.
// class PostponeTransitionScope {
//   USING_FAST_MALLOC(PostponeTransitionScope);
//
//   public:
//     explicit PostponeTransitionScope(DocumentLifecycle& document_lifecycle)
// : document_lifecycle_(document_lifecycle) {
//     document_lifecycle_.SetLifecyclePostponed();
//   }
// ~PostponeTransitionScope() {
//     document_lifecycle_.ResetLifecyclePostponed();
//   }
//
//   private:
//     DocumentLifecycle& document_lifecycle_;
// };

export class DocumentLifecycle {
  private state_ = LifecycleState.kUninitialized;
  private detach_count_ = 0;
  private disallow_transition_count_ = 0;
  private life_cycle_postponed_ = false;
  private check_no_transition_ = false;

  IsActive() { return this.state_ > LifecycleState.kInactive && this.state_ < LifecycleState.kStopping; }
  GetState() { return this.state_; }

  StateAllowsTreeMutations(): boolean {
    // TODO: We should not allow mutations in AfterPerformLayout
    // either, but we need to fix MediaList listeners and plugins first.
    const { state_ } = this;
    return state_ != LifecycleState.kInStyleRecalc && state_ != LifecycleState.kInPerformLayout &&
      state_ != LifecycleState.kInCompositingAssignmentsUpdate &&
      state_ != LifecycleState.kInCompositingInputsUpdate && state_ != LifecycleState.kInPrePaint &&
      state_ != LifecycleState.kInPaint;
  }
  StateAllowsLayoutTreeMutations(): boolean {
    return !!this.detach_count_ || this.state_ == LifecycleState.kInStyleRecalc;
  }
  StateAllowsDetach(): boolean {
    const { state_ } = this;

    return state_ == LifecycleState.kVisualUpdatePending || state_ == LifecycleState.kInStyleRecalc ||
      state_ == LifecycleState.kStyleClean || state_ == LifecycleState.kLayoutClean ||
      state_ == LifecycleState.kCompositingInputsClean ||
      state_ == LifecycleState.kCompositingAssignmentsClean || state_ == LifecycleState.kPrePaintClean ||
      state_ == LifecycleState.kPaintClean || state_ == LifecycleState.kStopping || state_ == LifecycleState.kInactive;
  }

  AdvanceTo(next_state: LifecycleState) {
    if (this.StateTransitionDisallowed())
      return false;

    // We can stop from anywhere.
    if (next_state == LifecycleState.kStopping)
      return true;

    switch (this.state_) {
      case  LifecycleState.kUninitialized:
        return next_state == LifecycleState.kInactive;
      case  LifecycleState.kInactive:
        if (next_state == LifecycleState.kStyleClean)
          return true;
        break;
      case  LifecycleState.kVisualUpdatePending:
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        if (next_state == LifecycleState.kInCompositingInputsUpdate ||
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        break;
      case  LifecycleState.kInStyleRecalc:
        return next_state == LifecycleState.kStyleClean;
      case  LifecycleState.kStyleClean:
        // We can synchronously recalc style.
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        // We can redundant arrive in the style clean state.
        if (next_state == LifecycleState.kStyleClean)
          return true;
        if (next_state == LifecycleState.kLayoutClean)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        break;
      case  LifecycleState.kInPerformLayout:
        return next_state == LifecycleState.kAfterPerformLayout;
      case  LifecycleState.kAfterPerformLayout:
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        if (next_state == LifecycleState.kLayoutClean)
          return true;
        break;
      case  LifecycleState.kLayoutClean:
        // We can synchronously recalc style.
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        // We can redundantly arrive in the layout clean state. This situation
        // can happen when we call layout recursively and we unwind the stack.
        if (next_state == LifecycleState.kLayoutClean)
          return true;
        if (next_state == LifecycleState.kStyleClean)
          return true;
        // InAccessibility only runs if there is an ExistingAXObjectCache.
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        break;
      case  LifecycleState.kInAccessibility:
        if (next_state == LifecycleState.kAccessibilityClean)
          return true;
        break;
      case  LifecycleState.kAccessibilityClean:
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInPrePaint)
          return true;
        break;
      case  LifecycleState.kInCompositingInputsUpdate:
        DCHECK(!RuntimeEnabledFeatures.CompositeAfterPaintEnabled());
        return next_state == LifecycleState.kCompositingInputsClean;
      case  LifecycleState.kInCompositingAssignmentsUpdate:
        DCHECK(!RuntimeEnabledFeatures.CompositeAfterPaintEnabled());
        // Once we are in the compositing update, we can either just clean the
        // inputs or do the whole of compositing.
        return next_state == LifecycleState.kCompositingAssignmentsClean;
      case  LifecycleState.kCompositingInputsClean:
        // We can return to style re-calc, layout, or the start of compositing.
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingAssignmentsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        // Otherwise, we can continue onwards.
        if (next_state == LifecycleState.kCompositingAssignmentsClean)
          return true;
        break;
      case  LifecycleState.kCompositingAssignmentsClean:
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInPaint)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        break;
      case  LifecycleState.kInPrePaint:
        if (next_state == LifecycleState.kPrePaintClean)
          return true;
        break;
      case  LifecycleState.kPrePaintClean:
        if (next_state == LifecycleState.kInPaint)
          return true;
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingAssignmentsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        break;
      case  LifecycleState.kInPaint:
        if (next_state == LifecycleState.kPaintClean)
          return true;
        break;
      case  LifecycleState.kPaintClean:
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInPaint)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        break;
      case  LifecycleState.kStopping:
        return next_state == LifecycleState.kStopped;
      case  LifecycleState.kStopped:
        return false;
    }
    return false;
  }
  EnsureStateAtMost(state: LifecycleState) {
    DCHECK(state == LifecycleState.kVisualUpdatePending || state == LifecycleState.kStyleClean ||
      state == LifecycleState.kLayoutClean);
    if (this.state_ <= state)
      return;

    // #if DCHECK_IS_ON()
    DCHECK(this.CanRewindTo(state),
      'Cannot rewind document lifecycle from ',
      this.state_,
      ' to ',
      state,
      '.');
    // #endif
    CHECK(this.state_ == state || !this.check_no_transition_);
    this.state_ = state;
  }

  StateTransitionDisallowed() { return this.disallow_transition_count_; }
  IncrementNoTransitionCount() { this.disallow_transition_count_++; }
  DecrementNoTransitionCount() {
    DCHECK_GT(this.disallow_transition_count_, 0);
    this.disallow_transition_count_--;
  }

  InDetach() { return !!this.detach_count_; }
  IncrementDetachCount() { this.detach_count_++; }
  DecrementDetachCount() {
    DCHECK_GT(this.detach_count_, 0);
    this.detach_count_--;
  }

  LifecyclePostponed() { return this.life_cycle_postponed_; }

  private CanAdvanceTo(next_state: LifecycleState): boolean {
    if (this.StateTransitionDisallowed())
      return false;

    // We can stop from anywhere.
    if (next_state == LifecycleState.kStopping)
      return true;

    switch (this.state_) {
      case LifecycleState.kUninitialized:
        return next_state == LifecycleState.kInactive;
      case LifecycleState.kInactive:
        if (next_state == LifecycleState.kStyleClean)
          return true;
        break;
      case LifecycleState.kVisualUpdatePending:
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        if (next_state == LifecycleState.kInCompositingInputsUpdate ||
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        break;
      case LifecycleState.kInStyleRecalc:
        return next_state == LifecycleState.kStyleClean;
      case LifecycleState.kStyleClean:
        // We can synchronously recalc style.
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        // We can redundant arrive in the style clean state.
        if (next_state == LifecycleState.kStyleClean)
          return true;
        if (next_state == LifecycleState.kLayoutClean)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        break;
      case LifecycleState.kInPerformLayout:
        return next_state == LifecycleState.kAfterPerformLayout;
      case LifecycleState.kAfterPerformLayout:
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        if (next_state == LifecycleState.kLayoutClean)
          return true;
        break;
      case LifecycleState.kLayoutClean:
        // We can synchronously recalc style.
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInPerformLayout)
          return true;
        // We can redundantly arrive in the layout clean state. This situation
        // can happen when we call layout recursively and we unwind the stack.
        if (next_state == LifecycleState.kLayoutClean)
          return true;
        if (next_state == LifecycleState.kStyleClean)
          return true;
        // InAccessibility only runs if there is an ExistingAXObjectCache.
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        break;
      case LifecycleState.kInAccessibility:
        if (next_state == LifecycleState.kAccessibilityClean)
          return true;
        break;
      case LifecycleState.kAccessibilityClean:
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInPrePaint)
          return true;
        break;
      case LifecycleState.kInCompositingInputsUpdate:
        DCHECK(!RuntimeEnabledFeatures.CompositeAfterPaintEnabled());
        return next_state == LifecycleState.kCompositingInputsClean;
      case LifecycleState.kInCompositingAssignmentsUpdate:
        DCHECK(!RuntimeEnabledFeatures.CompositeAfterPaintEnabled());
        // Once we are in the compositing update, we can either just clean the
        // inputs or do the whole of compositing.
        return next_state == LifecycleState.kCompositingAssignmentsClean;
      case LifecycleState.kCompositingInputsClean:
        // We can return to style re-calc, layout, or the start of compositing.
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingAssignmentsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        // Otherwise, we can continue onwards.
        if (next_state == LifecycleState.kCompositingAssignmentsClean)
          return true;
        break;
      case LifecycleState.kCompositingAssignmentsClean:
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInPaint)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        break;
      case LifecycleState.kInPrePaint:
        if (next_state == LifecycleState.kPrePaintClean)
          return true;
        break;
      case LifecycleState.kPrePaintClean:
        if (next_state == LifecycleState.kInPaint)
          return true;
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingAssignmentsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        break;
      case LifecycleState.kInPaint:
        if (next_state == LifecycleState.kPaintClean)
          return true;
        break;
      case LifecycleState.kPaintClean:
        if (next_state == LifecycleState.kInStyleRecalc)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingInputsUpdate)
          return true;
        if (!RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kInCompositingAssignmentsUpdate)
          return true;
        if (RuntimeEnabledFeatures.CompositeAfterPaintEnabled() &&
          next_state == LifecycleState.kCompositingInputsClean)
          return true;
        if (next_state == LifecycleState.kInPrePaint)
          return true;
        if (next_state == LifecycleState.kInPaint)
          return true;
        if (next_state == LifecycleState.kInAccessibility)
          return true;
        break;
      case LifecycleState.kStopping:
        return next_state == LifecycleState.kStopped;
      case LifecycleState.kStopped:
        return false;
    }
    return false;
  }
  private CanRewindTo(next_state: LifecycleState) {
    if (this.StateTransitionDisallowed())
      return false;

    // // This transition is bogus, but we've allowed it anyway.
    // if (g_deprecated_transition_stack &&
    //   state_ == g_deprecated_transition_stack->From() &&
    // next_state == g_deprecated_transition_stack->To())
    // return true;
    const { state_ } = this;
    return state_ == LifecycleState.kStyleClean || state_ == LifecycleState.kAfterPerformLayout ||
      state_ == LifecycleState.kLayoutClean || state_ == LifecycleState.kAccessibilityClean ||
      state_ == LifecycleState.kCompositingInputsClean ||
      state_ == LifecycleState.kCompositingAssignmentsClean || state_ == LifecycleState.kPrePaintClean ||
      state_ == LifecycleState.kPaintClean;
  }

  private SetLifecyclePostponed() { this.life_cycle_postponed_ = true; }
  private ResetLifecyclePostponed() { this.life_cycle_postponed_ = false; }
};
