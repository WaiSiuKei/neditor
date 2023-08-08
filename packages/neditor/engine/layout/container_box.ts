import {
  Box,
  Boxes,
  ContainingBlocksWithOverflowHidden,
  LayoutParams,
  RelationshipToBox,
  StackingContextContainerBoxInfo,
  StackingContextContainerBoxStack
} from './box';
import { BaseDirection } from './base_direction';
import { LayoutUnit } from './layout_unit';
import { CompositionNode, CompositionNodeBuilder } from '../render_tree/composition_node';
import { Vector2dLayoutUnit } from './vector2d_layout_unit';
import { DCHECK } from '@neditor/core/base/check';
import { KeywordValue } from '../cssom/keyword_value';
import { NumberValue } from '../cssom/number_value';
import { DCHECK_EQ, DCHECK_GT, DCHECK_NE } from '@neditor/core/base/check_op';
import { GetUsedBottomIfNotAuto, GetUsedLeftIfNotAuto, GetUsedRightIfNotAuto, GetUsedTopIfNotAuto } from './used_style';
import { Optional } from '@neditor/core/base/common/typescript';
import { IsOverflowCropped } from '../cssom/computed_style_utils';
import { InsetsLayoutUnit } from './insets_layout_unit';
import { Vector2dF } from '../math/vector2d_f';
import { Node } from '../render_tree/node';
import { MapCoordinatesFlags } from './map_coordinates_flags';
import { QuadF } from '../math/quad_f';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';

class StackingContextChildInfo {
  box: Box;
  z_index: number;
  containing_block_relationship: RelationshipToBox;
  overflow_hidden_to_apply: ContainingBlocksWithOverflowHidden;
  constructor(
    box: Box,
    z_index: number,
    containing_block_relationship: RelationshipToBox,
    overflow_hidden_to_apply: ContainingBlocksWithOverflowHidden) {
    this.box = box;
    this.z_index = z_index;
    this.containing_block_relationship = containing_block_relationship;
    this.overflow_hidden_to_apply = overflow_hidden_to_apply;
  }
}

class ZIndexComparator {
  EXEC(lhs: StackingContextChildInfo,
       rhs: StackingContextChildInfo): boolean {
    return lhs.z_index < rhs.z_index;
  }
}

// Note: find(StackingContextChildInfo) and erase(StackingContextChildInfo) on
// ZIndexSortedList may not work as expected due to the use of reflexive
// comparison for equality.
type ZIndexSortedList = Map<StackingContextChildInfo, ZIndexComparator>

export abstract class ContainerBox extends Box {
  // A list of our direct children.  If a box is one of our child boxes, we
  // are that box's parent.  We may not be the box's containing block (such
  // as for 'absolute' or 'fixed' position elements).
  private child_boxes_: Boxes = [];

  // A list of our positioned child boxes.  For each box in our list of
  // positioned_child_boxes_, we are that child's containing block.  This is
  // used for properly positioning and sizing positioned child elements.
  positioned_child_boxes_: Box[] = [];

  // A list of descendant positioned boxes and stacking context children within
  // our stacking context that should be drawn after this box, sorted by
  // z-index.
  negative_z_index_stacking_context_children_: ZIndexSortedList = new Map<StackingContextChildInfo, ZIndexComparator>();
  non_negative_z_index_stacking_context_children_: ZIndexSortedList = new Map<StackingContextChildInfo, ZIndexComparator>();

  update_size_results_valid_: boolean = false;

  // Whether or not the cross references--which refers to positioned children
  // and z-index children of the container--are valid, and do not need to be
  // updated the next time cross references are needed.
  are_cross_references_valid_: boolean = false;

  // Whether or not bidi level run splitting has already occurred. This is
  // tracked so it will never be attempted more than once.
  are_bidi_levels_runs_split_: boolean = false;

  // The next draw order position within this box's stacking context.
  next_draw_order_position_: number = 0;

  //#region public

  // Attempts to add a child box and takes the ownership if succeeded. Returns
  // true if the child's box level is compatible with the container box. Block
  // container boxes are able to become parents of both block- and inline-level
  // boxes, while inline container boxes are only able to become parents
  // of inline-level boxes.
  abstract TryAddChild(child_box: Box): boolean
  // Attempts to split the box right before the end. Returns the part after
  // the split if the split succeeded. Only inline boxes are splittable and it's
  // always possible to split them. The returned part is identical to
  // the original container, except that the former is empty.
  //
  // A box generator uses this method to break inline boxes around block-level
  // boxes.
  abstract TrySplitAtEnd(): Optional<ContainerBox>;

  // From |Box|.
  SplitBidiLevelRuns(): void {
    // Only split the child boxes if the bidi level runs haven't already been
    // split.
    if (!this.are_bidi_levels_runs_split_) {
      this.are_bidi_levels_runs_split_ = true;

      for (let child_box of this.child_boxes_) {
        child_box.SplitBidiLevelRuns();
      }
    }
  }

  // Invalidates the cross references, indicating that they need to be
  // re-generated the next time they are needed.
  InvalidateCrossReferencesOfBoxAndAncestors(): void {
    // NOTE: The cross reference containers are not cleared here. Instead they are
    // cleared when the cross references are updated.
    this.are_cross_references_valid_ = false;
    super.InvalidateCrossReferencesOfBoxAndAncestors();
  }

  // ContainerBox* AsContainerBox() override;
  // const ContainerBox* AsContainerBox() const override;

  RenderAndAnimateContent(
    content_node_builder: CompositionNodeBuilder,
    stacking_context: ContainerBox): void {
    // Update the stacking context if this is found to be a stacking context.
    let this_as_stacking_context: ContainerBox = this;

    // Reset the draw order for this box. Even if it isn't explicitly a stacking
    // context, it'll be used as one for in-flow, non-positioned child boxes.
    this_as_stacking_context.next_draw_order_position_ = 0;

    // If this is a stacking context, then ensure that the
    // stacking context children are up to date. This will also update the
    // stacking context children for any descendant container boxes that are
    // part of this stacking context.
    if (this.IsStackingContext()) {
      stacking_context = this_as_stacking_context;
      stacking_context.UpdateCrossReferences();
    }

    let content_box_offset = new Vector2dLayoutUnit(this.GetContentBoxOffsetFromBorderBox());

    // Render all child stacking contexts and positioned children in our stacking
    // context that have negative z-index values.
    //   https://www.w3.org/TR/CSS21/visuren.html#z-index
    if (this.negative_z_index_stacking_context_children_.size) {
      this.RenderAndAnimateStackingContextChildren(
        this.negative_z_index_stacking_context_children_, content_node_builder,
        content_box_offset, stacking_context);
    }

    // Render in-flow, non-positioned child boxes.
    //   https://www.w3.org/TR/CSS21/visuren.html#z-index
    for (let child_box of this.child_boxes_) {
      if (!child_box.IsPositioned() && !child_box.IsStackingContext()) {
        child_box.RenderAndAnimate(
          content_node_builder,
          this_as_stacking_context,
          content_box_offset.toVector2dF(),
          this_as_stacking_context);
      }
    }

    // Render all child stacking contexts and positioned children in our stacking
    // context that have non-negative z-index values.
    //   https://www.w3.org/TR/CSS21/visuren.html#z-index
    if (this.non_negative_z_index_stacking_context_children_.size) {
      this.RenderAndAnimateStackingContextChildren(
        this.non_negative_z_index_stacking_context_children_, content_node_builder,
        content_box_offset, stacking_context);
    }
  }

  // Returns true if the given style allows a container box to act as a
  // containing block for absolutely positioned elements.  For example it will
  // be true if this box's style is itself 'absolute'.
  IsContainingBlockForPositionAbsoluteElements(): boolean {
    return !this.parent() ||
      this.computed_style()!.IsContainingBlockForPositionAbsoluteElements();
  }

  // Returns true if the given style allows a container box to act as a
  // containing block for fixed positioned elements.  For example it will
  // be true if this box is transformed, as indicated at the bottom of this
  // section: https://www.w3.org/TR/css3-transforms/#transform-rendering.
  IsContainingBlockForPositionFixedElements(): boolean {
    return !this.parent() || this.IsTransformed();
  }

  // Returns true if the box serves as a stacking context for descendant
  // elements. The core stacking context creation criteria is given here
  // (https://www.w3.org/TR/CSS21/visuren.html#z-index) however it is extended
  // by various other specification documents such as those describing opacity
  // (https://www.w3.org/TR/css3-color/#transparency) and transforms
  // (https://www.w3.org/TR/css3-transforms/#transform-rendering).
  IsStackingContext(): boolean {
    // The core stacking context creation criteria is given here
    // (https://www.w3.org/TR/CSS21/visuren.html#z-index) however it is extended
    // by various other specification documents such as those describing opacity
    // (https://www.w3.org/TR/css3-color/#transparency) and transforms
    // (https://www.w3.org/TR/css3-transforms/#transform-rendering).
    // NOTE: Fixed position elements are treated as stacking contexts. While the
    // spec does not specify that they create a stacking context, this is the
    // functionality of Chrome, Firefox, Edge, and Safari.
    return !this.parent() ||
      ((this.computed_style()!.opacity as NumberValue).value() < 1) ||
      this.IsTransformed() ||
      (this.IsPositioned() &&
        this.computed_style()!.z_index != KeywordValue.GetAuto()) ||
      this.computed_style()!.position == KeywordValue.GetFixed();
  }

  //#endregion

  //#region protected

  UpdateRectOfPositionedChildBoxes(
    relative_child_layout_params: LayoutParams,
    absolute_child_layout_params: LayoutParams): void {
    // Ensure that the cross references are up to date.
    this.UpdateCrossReferences();

    for (let child_box of this.child_boxes_) {
      DCHECK_EQ(this, child_box.GetContainingBlock());

      let child_box_position =
        child_box.computed_style()!.position;

      if (child_box_position == KeywordValue.GetAbsolute()) {
        this.UpdateRectOfAbsolutelyPositionedChildBox(child_box,
          absolute_child_layout_params);
      } else if (child_box_position == KeywordValue.GetFixed()) {
        this.UpdateRectOfAbsolutelyPositionedChildBox(child_box,
          relative_child_layout_params);
      } else if (child_box_position == KeywordValue.GetStatic()) {
        // noop
      } else {
        DCHECK(child_box_position == KeywordValue.GetRelative());
        this.UpdateOffsetOfRelativelyPositionedChildBox(child_box,
          relative_child_layout_params);
      }

      // Verify that the positioned child boxes didn't get cleared during the
      // walk. This should never happen because the cross references being
      // invalidated should not cause them to be cleared.
      DCHECK_GT(this.positioned_child_boxes_.length, 0);
    }
  }

  // Adds the child box to the end of the list of direct children.
  // NOTE: This should only be called during box generation.
  PushBackDirectChild(child_box: Box): void {
    // Verify that the child doesn't have a pre-existing parent.
    DCHECK(!child_box.parent());

    // Verify that this container hasn't had its sizes and cross references
    // already updated. This is because children should only ever be added to
    // containers created during the current box generation run.
    DCHECK(!this.update_size_results_valid_);
    DCHECK(!this.are_cross_references_valid_);

    child_box.parent_ = this;
    this.child_boxes_.push(child_box);
  }

  // Adds the split sibling of the specified child as another direct child.
  // NOTE: This should be called immediately after the split sibling is created.
  InsertSplitSiblingOfDirectChild(child_position: number): number {
    let child = this.child_boxes_[child_position];
    let split_sibling = child.GetSplitSibling()!;

    // Verify that the split sibling exists and that it doesn't have a
    // pre-existing parent.
    DCHECK(split_sibling);
    DCHECK(!split_sibling.parent());

    // Set the parent of the split sibling to this container.
    split_sibling.parent_ = this;

    // Add the split sibling to this container after it's sibling.
    let split_sibling_position = this.child_boxes_.splice(
      child_position + 1, 0, split_sibling);

    // Invalidate the size now that the children have changed.
    this.update_size_results_valid_ = false;

    // Check to see if the split sibling is positioned, which means that it
    // needs to invalidate its containing block's cross references.
    let is_positioned = split_sibling.IsPositioned();
    if (is_positioned) {
      split_sibling.GetContainingBlock().are_cross_references_valid_ = false;
    }
    // Check to see if the split sibling is a stacking context child, which means
    // that it needs to invalidate its stacking context's cross references.
    if (is_positioned || split_sibling.IsStackingContext()) {
      split_sibling.GetStackingContext().are_cross_references_valid_ = false;
    }

    // Invalidate the render tree nodes now that the children have changed.
    this.InvalidateRenderTreeNodesOfBoxAndAncestors();

    return child_position + 1;
  }

  // Moves all of the direct children starting with the iterator from this
  // container to its split sibling.
  // NOTE: This should be called immediately after the split sibling is created
  // and prior to it being inserted into the tree.
  MoveDirectChildrenToSplitSibling(start_position: number): void {
    // Verify that the move includes children.
    DCHECK(start_position != this.child_boxes_.length);

    let split_sibling: ContainerBox = this.GetSplitSibling() as ContainerBox;

    // Verify that the split sibling exists and that it hasn't been processed yet.
    DCHECK(split_sibling);
    DCHECK(!split_sibling.parent());
    DCHECK(!split_sibling.update_size_results_valid_);
    DCHECK(!split_sibling.are_cross_references_valid_);

    // Update the parent of the children being moved.
    // Add the children to the split sibling's list of children.
    for (let i = start_position; i < this.child_boxes_.length; i++) {
      let child = this.child_boxes_[i];
      child.parent_ = split_sibling;
      split_sibling.child_boxes_.push(child);
    }

    this.child_boxes_.length = start_position;

    // Invalidate the size now that the children have changed.
    this.update_size_results_valid_ = false;

    // Handle invalidating cross references. Children are only being removed from
    // this container, so cross references only need to be invalidated if there is
    // a non-empty cross reference list that can potentially be impacted.

    // If there are any positioned boxes, then they need to be re-generated.
    if (this.positioned_child_boxes_.length) {
      this.are_cross_references_valid_ = false;
    }

    // There are two cases where the stacking context's cross references can be
    // impacted by children moving from one container to another. With both cases,
    // stacking context children must exist or there is nothing to update.
    //   1. Stacking context children are potentially moving from this child
    //      container to the split sibling child container.
    //   2. Stacking context children contained within this overflow hidden
    //      container are potentially moving to the split sibling overflow hidden
    //      container.
    if (this.HasStackingContextChildren() || IsOverflowCropped(this.computed_style()!)) {
      // Walk up the tree until the nearest stacking context is found. If this box
      // is a stacking context, then it will be used.
      let nearest_stacking_context: ContainerBox = this;
      while (!nearest_stacking_context.IsStackingContext()) {
        nearest_stacking_context = nearest_stacking_context.parent()!;
      }
      if (nearest_stacking_context.HasStackingContextChildren()) {
        nearest_stacking_context.are_cross_references_valid_ = false;
      }
    }

    // Invalidate the render tree nodes now that the children have changed.
    this.InvalidateRenderTreeNodesOfBoxAndAncestors();
  }

  child_boxes(): Boxes {
    return this.child_boxes_;
  }

  UpdateCrossReferencesOfContainerBox(
    source_box: ContainerBox,
    nearest_containing_block: RelationshipToBox,
    nearest_absolute_containing_block: RelationshipToBox,
    nearest_fixed_containing_block: RelationshipToBox,
    nearest_stacking_context: RelationshipToBox,
    stacking_context_container_box_stack: StackingContextContainerBoxStack) {
    // First update the source container box's cross references with this box.
    super.UpdateCrossReferencesOfContainerBox(
      source_box, nearest_containing_block, nearest_absolute_containing_block,
      nearest_fixed_containing_block, nearest_stacking_context,
      stacking_context_container_box_stack);

    // In addition to updating the source container box's cross references with
    // this box, we also recursively update it with our children.

    // Set the nearest flags for the children. If this container box is any of the
    // specified types, then the target container box cannot be the nearest box of
    // that type for the children.

    const kNearestContainingBlockOfChildren = RelationshipToBox.kIsBoxDescendant;
    let nearest_absolute_containing_block_of_children =
      nearest_absolute_containing_block != RelationshipToBox.kIsBoxDescendant &&
      this.IsContainingBlockForPositionAbsoluteElements()
        ? RelationshipToBox.kIsBoxDescendant
        : nearest_absolute_containing_block;
    let nearest_fixed_containing_block_of_children =
      nearest_fixed_containing_block != RelationshipToBox.kIsBoxDescendant &&
      this.IsContainingBlockForPositionFixedElements()
        ? RelationshipToBox.kIsBoxDescendant
        : nearest_fixed_containing_block;
    let nearest_stacking_context_of_children =
      nearest_stacking_context != RelationshipToBox.kIsBoxDescendant && this.IsStackingContext()
        ? RelationshipToBox.kIsBoxDescendant
        : nearest_stacking_context;

    // If the source box is the stacking context for this container box, then
    // clear out this box's stacking context children. They are being set now by
    // the stacking context. Additionally, add this container to the stack, so
    // that it will be considered as a possible destination for the stacking
    // context children.
    if (nearest_stacking_context_of_children == RelationshipToBox.kIsBox) {
      this.negative_z_index_stacking_context_children_.clear();
      this.non_negative_z_index_stacking_context_children_.clear();

      let has_absolute_position =
        this.computed_style()!.position == KeywordValue.GetAbsolute();
      let has_overflow_hidden = IsOverflowCropped(this.computed_style()!);

      stacking_context_container_box_stack.push(
        new StackingContextContainerBoxInfo(
          this,
          this.IsContainingBlockForPositionAbsoluteElements(),
          has_absolute_position,
          has_overflow_hidden));
    }

    // Only process the children if the target container box is still the nearest
    // box of one of the types. If it is not, then it is impossible for any of the
    // children to be added to the cross references.
    if (nearest_absolute_containing_block_of_children == RelationshipToBox.kIsBox ||
      nearest_fixed_containing_block_of_children == RelationshipToBox.kIsBox ||
      nearest_stacking_context_of_children == RelationshipToBox.kIsBox) {
      for (let child_box of this.child_boxes_) {
        child_box.UpdateCrossReferencesOfContainerBox(
          source_box, kNearestContainingBlockOfChildren,
          nearest_absolute_containing_block_of_children,
          nearest_fixed_containing_block_of_children,
          nearest_stacking_context_of_children,
          stacking_context_container_box_stack);
      }
    }

    // Pop this container from the stack if it was previously added.
    if (nearest_stacking_context_of_children == RelationshipToBox.kIsBox) {
      stacking_context_container_box_stack.pop();
    }
  }

  ValidateUpdateSizeInputs(params: LayoutParams): boolean {
    // Take into account whether our children have been modified to determine
    // if our sizes are invalid and need to be recomputed.
    if (super.ValidateUpdateSizeInputs(params) && this.update_size_results_valid_) {
      return true;
    } else {
      this.update_size_results_valid_ = true;
      return false;
    }
  }
  InvalidateUpdateSizeInputs(): void {
    this.update_size_results_valid_ = false;
  }

// Add a box and all of its descendants that are contained within the
// specified stacking context to the stacking context's draw order. This is
// used when a render tree node that is already cached is encountered to
// ensure that it maintains the proper draw order in its stacking context.
  AddBoxAndDescendantsToDrawOrderInStackingContext(
    stacking_context: ContainerBox): void {
    super.AddBoxAndDescendantsToDrawOrderInStackingContext(stacking_context);
    // If this is a stacking context, then there's no more work to do. None of
    // the stacking context children can be part of the ancestor stacking context.
    // If this is not a stacking context, then all of the stacking context
    // children are still part of the same stacking context.
    if (!this.IsStackingContext()) {
      // Non-stacking contexts can only have stacking context children with a
      // z-index of zero. Any child with non-zero z-index, must be added to the
      // stacking context itself.
      DCHECK(this.negative_z_index_stacking_context_children_.size);
      for (let [value, key] of this.non_negative_z_index_stacking_context_children_) {
        value.box.AddBoxAndDescendantsToDrawOrderInStackingContext(stacking_context);
      }
    }
  }
  //#endregion
  //#region private

  // Called by a box within this stacking context when it is being added to the
  // render tree so that it can get its position in the stacking context's
  // draw order.
  public AddToDrawOrderInThisStackingContext(): number {
    return this.next_draw_order_position_++;
  }
  //#endregion

  // static Boxes::iterator RemoveConst(Boxes* container,
  // Boxes::const_iterator const_iter);
  // FindContainingBlock(box: Box): ContainerBox {}

  // Update the cross references of the container box if they are invalid.
  UpdateCrossReferences(): void {
    if (!this.are_cross_references_valid_) {
      // If this point is reached, then the cross references for this container
      // box are being re-generated.
      // layout_stat_tracker().OnUpdateCrossReferences();

      let is_stacking_context = this.IsStackingContext();

      // Cross references are not cleared when they are invalidated. This is
      // because they can be invalidated while they are being walked if a
      // relatively positioned descendant is split. Therefore, they need to be
      // cleared now before they are regenerated.
      this.positioned_child_boxes_.length = 0;
      if (is_stacking_context) {
        this.negative_z_index_stacking_context_children_.clear();
        this.non_negative_z_index_stacking_context_children_.clear();
      }

      // This stack tracks all container boxes within the stacking context. The
      // container boxes will only be pushed and popped if the current box is
      // their stacking context.
      let stacking_context_container_box_stack: StackingContextContainerBoxStack = [];

      const kNearestContainingBlockOfChildren = RelationshipToBox.kIsBox;
      let nearest_absolute_containing_block =
        this.IsContainingBlockForPositionAbsoluteElements() ? RelationshipToBox.kIsBox
          : RelationshipToBox.kIsBoxAncestor;
      let nearest_fixed_containing_block =
        this.IsContainingBlockForPositionFixedElements() ? RelationshipToBox.kIsBox : RelationshipToBox.kIsBoxAncestor;
      let nearest_stacking_context =
        is_stacking_context ? RelationshipToBox.kIsBox : RelationshipToBox.kIsBoxAncestor;

      for (let child_box of this.child_boxes_) {
        child_box.UpdateCrossReferencesOfContainerBox(
          this, kNearestContainingBlockOfChildren,
          nearest_absolute_containing_block, nearest_fixed_containing_block,
          nearest_stacking_context, stacking_context_container_box_stack);
      }

      this.are_cross_references_valid_ = true;
    }
  }

  // These helper functions are called from
  // Box::UpdateCrossReferencesOfContainerBox().
  AddContainingBlockChild(child_box: Box): void {
    DCHECK_NE(this, child_box);
    DCHECK_EQ(this, child_box.GetContainingBlock());
    this.positioned_child_boxes_.push(child_box);
  }
  AddStackingContextChild(
    child_box: Box,
    child_z_index: number,
    containing_block_relationship: RelationshipToBox,
    overflow_hidden_to_apply: ContainingBlocksWithOverflowHidden) {
    DCHECK_NE(this, child_box);
    DCHECK_EQ(child_z_index, child_box.GetZIndex());
    // If this is a stacking context, then verify that the child box's stacking
    // context is this stacking context.
    // Otherwise, verify that this box's stacking context is also the child box's
    // stacking context and that the z_index of the child is 0 (non-zero z-index
    // children must be added directly to the stacking context).
    DCHECK(this.IsStackingContext()
      ? this == child_box.GetStackingContext()
      : this.GetStackingContext() == child_box.GetStackingContext() &&
      child_z_index == 0);

    let stacking_context_children =
      child_z_index < 0 ? this.negative_z_index_stacking_context_children_
        : this.non_negative_z_index_stacking_context_children_;
    stacking_context_children.set(new StackingContextChildInfo(
      child_box, child_z_index, containing_block_relationship,
      overflow_hidden_to_apply), new ZIndexComparator());
  }

  // Returns whether or not the container has any stacking context children.
  HasStackingContextChildren(): boolean {
    return this.negative_z_index_stacking_context_children_.size > 0 ||
      this.non_negative_z_index_stacking_context_children_.size > 0;
  }

  // Updates used values of left/top/right/bottom given the child_box's
  // 'position' property is set to 'relative'.
  //    https://www.w3.org/TR/CSS21/visuren.html#relative-positioning
  UpdateOffsetOfRelativelyPositionedChildBox(
    child_box: Box,
    child_layout_params: LayoutParams) {
    DCHECK_EQ(child_box.computed_style()!.position,
      KeywordValue.GetRelative());

    let maybe_left: Optional<LayoutUnit> = GetUsedLeftIfNotAuto(
      child_box.computed_style()!, child_layout_params.containing_block_size!);
    let maybe_right: Optional<LayoutUnit> = GetUsedRightIfNotAuto(
      child_box.computed_style()!, child_layout_params.containing_block_size!);
    let maybe_top: Optional<LayoutUnit> = GetUsedTopIfNotAuto(
      child_box.computed_style()!, child_layout_params.containing_block_size!);
    let maybe_bottom: Optional<LayoutUnit> = GetUsedBottomIfNotAuto(
      child_box.computed_style()!, child_layout_params.containing_block_size!);

    let offset = new Vector2dLayoutUnit();

    // The following steps are performed according to the procedure described
    // here: https://www.w3.org/TR/CSS21/visuren.html#relative-positioning

    // For relatively positioned elements, 'left' and 'right' move the box(es)
    // horizontally, without changing their size.
    if (!maybe_left && !maybe_right) {
      // If both 'left' and 'right' are 'auto' (their initial values), the used
      // values are '0' (i.e., the boxes stay in their original position).
      offset.set_x(new LayoutUnit());
    } else if (maybe_left && !maybe_right) {
      // If 'right' is 'auto', its used value is minus the value of 'left'.
      offset.set_x(maybe_left);
    } else if (!maybe_left && maybe_right) {
      // If 'left' is 'auto', its used value is minus the value of 'right'
      offset.set_x(maybe_right.NEG());
    } else {
      // If neither 'left' nor 'right' is 'auto', the position is
      // over-constrained, and one of them has to be ignored. If the 'direction'
      // property of the containing block is 'ltr', the value of 'left' wins and
      // 'right' becomes -'left'. If 'direction' of the containing block is 'rtl',
      // 'right' wins and 'left' is ignored.
      if (child_layout_params.containing_block_direction ==
        BaseDirection.kLeftToRightBaseDirection) {
        offset.set_x(maybe_left!);
      } else {
        offset.set_x(maybe_right!.NEG());
      }
    }

    // The 'top' and 'bottom' properties move relatively positioned element(s) up
    // or down without changing their size.
    if (!maybe_top && !maybe_bottom) {
      // If both are 'auto', their used values are both '0'.
      offset.set_y(new LayoutUnit());
    } else if (maybe_top && !maybe_bottom) {
      // If one of them is 'auto', it becomes the negative of the other.
      offset.set_y(maybe_top);
    } else if (!maybe_top && maybe_bottom) {
      // If one of them is 'auto', it becomes the negative of the other.
      offset.set_y(maybe_bottom.NEG());
    } else {
      // If neither is 'auto', 'bottom' is ignored (i.e., the used value of
      // 'bottom' will be minus the value of 'top').
      offset.set_y(maybe_top!);
    }

    child_box.set_left(child_box.left().ADD(offset.x()));
    child_box.set_top(child_box.top().ADD(offset.y()));
  }

  // Updates the sizes of the fixed position child box.
  // This is meant to be called by UpdateRectOfPositionedChildBoxes(), after the
  // child has gone through the in-flow layout.
  //    https://www.w3.org/TR/CSS21/visuren.html#absolute-positioning
  UpdateRectOfAbsolutelyPositionedChildBox(
    child_box: Box, child_layout_params: LayoutParams) {
    let offset_from_containing_block_to_parent =
      GetOffsetFromContainingBlockToParentOfAbsolutelyPositionedBox(this,
        child_box);

    child_box.SetStaticPositionLeftFromContainingBlockToParent(
      offset_from_containing_block_to_parent.left());
    child_box.SetStaticPositionRightFromContainingBlockToParent(
      offset_from_containing_block_to_parent.right());
    child_box.SetStaticPositionTopFromContainingBlockToParent(
      offset_from_containing_block_to_parent.top());
    child_box.UpdateSize(child_layout_params);
  }

  // Add children (sorted by z-index) that belong to our stacking context to the
  // render tree.  The specific list of children to be rendered must be passed
  // in also, though it will likely only ever be either negative_z_index_child_
  // or non_negative_z_index_child_.
  RenderAndAnimateStackingContextChildren(
    stacking_context_child_list: ZIndexSortedList,
    content_node_builder: CompositionNodeBuilder,
    offset_from_parent_node: Vector2dLayoutUnit,
    stacking_context: ContainerBox) {
    // Create a coordinator that handles all logic involved with calling
    // RenderAndAnimate() on stacking context children., including determining
    // their offset from the child container and applying overflow hidden from the
    // child's containing blocks.
    let coordinator = new RenderAndAnimateStackingContextChildrenCoordinator(
      stacking_context, this, offset_from_parent_node, content_node_builder);

    // Render all children of the passed in list in sorted order.
    for (let [child_info, k] of stacking_context_child_list) {
      // If this container box is a stacking context, then verify that this child
      // box belongs to it; otherwise, verify that the container box and the child
      // box share the same stacking context and that the child's z-index is 0.
      DCHECK(this.IsStackingContext()
        ? this == child_info.box.GetStackingContext()
        : this.GetStackingContext() ==
        child_info.box.GetStackingContext() &&
        child_info.z_index == 0);

      coordinator.RenderAndAnimateChild(child_info);
    }
  }

  DumpChildrenWithIndent(stream: string,
                         indent: number): string {
    stream = super.DumpChildrenWithIndent(stream, indent);

    for (let child_box of this.child_boxes()) {
      stream = child_box.DumpWithIndent(stream, indent);
    }
    return stream;
  }

  override AsContainerBox(): Optional<ContainerBox> {
    return this;
  }

  AbsoluteQuads(
    quads: QuadF[],
    mode: MapCoordinatesFlags = 0) {
    this.QuadsInternal(quads, mode, true);
  }

  protected QuadsInternal(
    quads: QuadF[],
    mode: MapCoordinatesFlags,
    map_to_absolute: boolean): void {

    if (map_to_absolute)
      this.AbsoluteQuadsForSelf(quads, mode);
    else
      NOTIMPLEMENTED();
    // LocalQuadsForSelf(quads);
  }

  abstract AbsoluteQuadsForSelf(quads: QuadF[], mode: MapCoordinatesFlags): void

  dispose() {
    super.dispose();
    for (let box of this.child_boxes_) {
      box.dispose();
    }
    this.child_boxes_.length = 0;
  }
}

function GetOffsetFromContainingBlockToParentOfAbsolutelyPositionedBox(
  containing_block: ContainerBox, child_box: Box): InsetsLayoutUnit {
  // NOTE: Bottom inset is not computed and should not be queried.
  DCHECK(child_box.IsAbsolutelyPositioned());
  DCHECK_EQ(child_box.GetContainingBlock(), containing_block);

  let offset = new InsetsLayoutUnit();

  let current_box = child_box.parent();
  if (!current_box) {
    throw new Error('500');
  }
  while (current_box != containing_block) {
    DCHECK(current_box.parent());
    DCHECK(!current_box.IsTransformed());
    const next_box: ContainerBox = current_box.GetContainingBlock();
    offset.ASS_ASSIGN(current_box.GetContentBoxInsetFromContainingBlockContentBox(next_box));
    current_box = next_box;
  }

  // The containing block is formed by the padding box instead of the content
  // box for absolutely positioned boxes, as described in
  // http://www.w3.org/TR/CSS21/visudet.html#containing-block-details.
  // NOTE: While not explicitly stated in the spec, which specifies that
  // the containing block of a 'fixed' position element must always be the
  // viewport, all major browsers use the padding box of a transformed ancestor
  // as the containing block for 'fixed' position elements.
  offset.ASS_ASSIGN(new InsetsLayoutUnit(containing_block.padding_left(),
    containing_block.padding_top(),
    containing_block.padding_right(), new LayoutUnit()));

  return offset;
}

class OverflowHiddenInfo {
  node_builder: CompositionNodeBuilder;
  containing_block: ContainerBox;
  constructor(
    containing_block: ContainerBox
  ) {
    this.node_builder = new CompositionNodeBuilder(new Vector2dF());
    this.containing_block = containing_block;
  }
}

export type OverflowHiddenStack = OverflowHiddenInfo[]

// This class handles all logic involved with calling RenderAndAnimate() on
// stacking context children., including determining their offset from the child
// container and applying overflow hidden from its containing blocks.
class RenderAndAnimateStackingContextChildrenCoordinator {
  private stacking_context_: ContainerBox;
  private child_container_: ContainerBox;
  private child_container_offset_from_parent_node_: Vector2dLayoutUnit;

  private base_node_builder_: CompositionNodeBuilder;
  private overflow_hidden_stack_: OverflowHiddenStack = [];

  constructor(
    stacking_context: ContainerBox,
    child_container: ContainerBox,
    child_container_offset_from_parent_node: Vector2dLayoutUnit,
    base_node_builder: CompositionNodeBuilder
  ) {
    this.stacking_context_ = stacking_context;
    this.child_container_ = child_container;
    this.child_container_offset_from_parent_node_ = child_container_offset_from_parent_node;
    this.base_node_builder_ = base_node_builder;
  }

  // Applies overflow hidden from the child's containing blocks and then calls
  // RenderAndAnimate() on it.
  RenderAndAnimateChild(
    child_info: StackingContextChildInfo) {
    this.ApplyOverflowHiddenForChild(child_info.overflow_hidden_to_apply);

    // Generate the offset from the child container to the child box.
    const child_containing_block: ContainerBox = child_info.box.GetContainingBlock();
    let position_offset: Vector2dLayoutUnit =
      this.child_container_offset_from_parent_node_
        .ADD(this.GetOffsetFromChildContainerToContainingBlockContentBox(child_containing_block, child_info.containing_block_relationship))
        .ADD(child_info.box.GetContainingBlockOffsetFromItsContentBox(child_containing_block));

    child_info.box.RenderAndAnimate(
      this.GetActiveNodeBuilder(),
      child_containing_block,
      position_offset.toVector2dF(),
      this.stacking_context_);
  }

// Updates |overflow_hidden_stack_| with the overflow hidden containing blocks
// of the current child. Any entries in |overflow_hidden_stack_| that are no
// longer valid are popped. All entries that remain valid are retained, so
// that filter nodes can be shared across stacking context children.
  private ApplyOverflowHiddenForChild(
    overflow_hidden_to_apply: ContainingBlocksWithOverflowHidden) {
// Walk the overflow hidden list being applied and the active overflow hidden
    // stack looking for the first index where there's a mismatch. All entries
    // prior to this are retained. This allows as many FilterNodes as possible to
    // be shared between the stacking context children.
    let index = 0;
    for (; index < overflow_hidden_to_apply.length &&
           index < this.overflow_hidden_stack_.length;
           ++index) {
      if (overflow_hidden_to_apply[index] !=
        this.overflow_hidden_stack_[index].containing_block) {
        break;
      }
    }

    // Pop all entries in the active overflow hidden stack that follow the index
    // mismatch. They're no longer contained within the overflow hidden list being
    // applied.
    while (index < this.overflow_hidden_stack_.length) {
      this.PopOverflowHiddenEntryFromStack();
    }

    // Add the new overflow hidden entries to the active stack.
    for (; index < overflow_hidden_to_apply.length; ++index) {
      this.overflow_hidden_stack_.push(
        new OverflowHiddenInfo(overflow_hidden_to_apply[index]));
    }
  }

// Generates a filter node from the top entry in |overflow_hidden_stack_| and
// adds it to the active node builder after the top entry is popped.
  private PopOverflowHiddenEntryFromStack() {
    DCHECK(this.overflow_hidden_stack_.length);
    // Before popping the top of the stack, a filter node is generated from it
    // that is added to next node builder.
    let overflow_hidden_info: OverflowHiddenInfo = this.overflow_hidden_stack_[this.overflow_hidden_stack_.length - 1]!;

    let containing_block: ContainerBox = overflow_hidden_info.containing_block;
    DCHECK(IsOverflowCropped(containing_block.computed_style()!));

    // Determine the offset from the child container to this containing block's
    // border box.
    let containing_block_border_offset: Vector2dLayoutUnit =
      this.GetOffsetFromChildContainerToContainingBlockContentBox(
        containing_block, RelationshipToBox.kIsBoxAncestor).SUB(containing_block.GetContentBoxOffsetFromBorderBox());

    // Apply the overflow hidden from this containing block to its composition
    // node; the resulting filter node is added to the next active node builder.
    let { rounded_corners, overflow_node } =
      containing_block.RenderAndAnimateOverflow(
        undefined,
        new CompositionNode(
          overflow_hidden_info.node_builder),
        new Vector2dF(containing_block_border_offset.x().toFloat(),
          containing_block_border_offset.y().toFloat()));
    let filter_node: Node = overflow_node;

    this.overflow_hidden_stack_.pop();
    this.GetActiveNodeBuilder().AddChild(filter_node);
  }

// Returns the node builder from the top entry in |overflow_hidden_stack_| if
// it is not empty; otherwise, returns |base_node_builder_|.
  private GetActiveNodeBuilder(): CompositionNodeBuilder {
    return this.overflow_hidden_stack_.length === 0
      ? this.base_node_builder_
      : this.overflow_hidden_stack_[this.overflow_hidden_stack_.length - 1].node_builder;
  }

// Returns the offset from the child container's content box to the containing
// block's content box.
  private GetOffsetFromChildContainerToContainingBlockContentBox(
    containing_block: ContainerBox,
    containing_block_relationship_to_child_container: RelationshipToBox): Vector2dLayoutUnit {
    if (containing_block_relationship_to_child_container == RelationshipToBox.kIsBox) {
      DCHECK_EQ(this.child_container_, containing_block);
      return new Vector2dLayoutUnit();
    }

    let offset = new Vector2dLayoutUnit();
    let current_box: ContainerBox =
      containing_block_relationship_to_child_container == RelationshipToBox.kIsBoxAncestor
        ? this.child_container_
        : containing_block;
    let end_box: ContainerBox =
      containing_block_relationship_to_child_container == RelationshipToBox.kIsBoxAncestor
        ? containing_block
        : this.child_container_;

    // Walk up the containing blocks from |current_box| to |end_box| adding the
    // offsets from each box to its containing block.
    // NOTE: |end_box| can be skipped during this walk both when |end_box| is not
    // positioned and when a fixed position box is encountered during the walk. In
    // this case, the walk will end when a box is found that either does not have
    // a parent (meaning that it's the root box) or is transformed (it is
    // impossible for |end_box| to be a more distant ancestor than a transformed
    // box).
    while (current_box != end_box && current_box.parent() && !current_box.IsTransformed()) {
      const next_box: ContainerBox = current_box.GetContainingBlock();
      offset.ADD_ASSIGN(current_box.GetContentBoxOffsetFromContainingBlockContentBox(next_box));
      current_box = next_box;
    }

    // If |current_box| does not equal |end_box|, then |end_box| was skipped
    // during the walk up the tree. Initiate a second walk up the tree from the
    // end box to the box where the first walk ended, subtracting the offsets
    // during this walk to remove the extra offsets added after passing |end_box|
    // during the first walk.
    let tmp = current_box;
    current_box = end_box;
    end_box = tmp;

    while (current_box != end_box) {
      DCHECK(current_box.parent());
      DCHECK(!current_box.IsTransformed());
      const next_box: ContainerBox = current_box.GetContainingBlock();
      offset.SUB_ASSIGN(current_box.GetContentBoxOffsetFromContainingBlockContentBox(next_box));
      current_box = next_box;
    }

    // If the containing block is an ancestor of the child container, then
    // reverse the offset now. The earlier calculations were for the containing
    // block being a descendant of the child container.
    if (containing_block_relationship_to_child_container == RelationshipToBox.kIsBoxAncestor) {
      offset = offset.NEG();
    }

    return offset;
  }
}

