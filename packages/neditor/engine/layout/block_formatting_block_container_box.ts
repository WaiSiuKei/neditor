// A block container box that establishes a block formatting context.
// Implementation-specific, not defined in CSS 2.1.
import { BlockContainerBox } from './block_container_box';
import { Box, LayoutParams, Level } from './box';
import { FormattingContext } from './formatting_context';
import { AnonymousBlockBox } from './anonymous_block_box';
import { IsOverflowCropped } from '../cssom/computed_style_utils';
import { LayoutUnit } from './layout_unit';
import { Optional } from '@neditor/core/base/common/typescript';
import { isNil } from '@neditor/core/base/common/type';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { GetComputedStyleOfAnonymousBox } from '../cssom/computed_style';
import { BlockFormattingContext } from './block_formatting_context';

export abstract class BlockFormattingBlockContainerBox extends BlockContainerBox {
  // From |ContainerBox|.
  TryAddChild(child_box: Box): boolean {
    this.AddChild(child_box);
    return true;
  }

  // Rest of the public methods.

  // A convenience method to add children. It is guaranteed that a block
  // container box is able to become a parent of both block-level and
  // inline-level boxes.
  AddChild(child_box: Box) {
    switch (child_box.GetLevel()) {
      case Level.kBlockLevel:
        if (!child_box.IsAbsolutelyPositioned()) {
          this.PushBackDirectChild(child_box);
          break;
        }
      // Fall through if child is out-of-flow.

      case Level.kInlineLevel:
        // An inline formatting context required,
        // add a child to an anonymous block box.
        this.GetOrAddAnonymousBlockBox().AddInlineLevelChild(child_box);
        break;
    }
  }

  // From |BlockContainerBox|.
  UpdateRectOfInFlowChildBoxes(child_layout_params: LayoutParams): FormattingContext {
// Only collapse in-flow, block-level boxes. Do not collapse root element and
    // the initial containing block. Do not collapse boxes with overflow not equal
    // to 'visible', because these create new formatting contexts.
    let is_collapsible =
      !this.IsAbsolutelyPositioned() && this.GetLevel() == Level.kBlockLevel && this.parent() &&
      this.parent()!.parent() && !IsOverflowCropped(this.computed_style()!);

    // Margins should only collapse if no padding or border separate them.
    //   https://www.w3.org/TR/CSS22/box.html#collapsing-margins
    let top_margin_is_collapsible = is_collapsible &&
      this.padding_top().EQ(new LayoutUnit()) &&
      this.border_top_width().EQ(new LayoutUnit());
    // Lay out child boxes in the normal flow.
    //   https://www.w3.org/TR/CSS21/visuren.html#normal-flow
    let block_formatting_context =
      new BlockFormattingContext(child_layout_params,
        !!top_margin_is_collapsible);
    for (let child_box of this.child_boxes()) {
      block_formatting_context.UpdateRect(child_box);
    }

    if (is_collapsible) {
      block_formatting_context.CollapseContainingMargins(this);
    }

    return block_formatting_context;
  }

  private GetLastChildAsAnonymousBlockBox(): Optional<AnonymousBlockBox> {
    return this.child_boxes().length === 0 ? undefined
      : this.child_boxes()[this.child_boxes().length - 1].AsAnonymousBlockBox();
  }
  private GetOrAddAnonymousBlockBox(): AnonymousBlockBox {
    let anonymous_block_box = this.GetLastChildAsAnonymousBlockBox();

    // If either the last box is not an anonymous block box, or the anonymous
    // block box already has a trailing line break and can't accept any additional
    // children, then create a new anonymous block box.
    if (isNil(anonymous_block_box) ||
      anonymous_block_box && anonymous_block_box.HasTrailingLineBreak()) {
      // TODO: Determine which animations to propagate to the anonymous block box,
      //       instead of none at all.
      let
        new_computed_style_declaration =
          new ComputedStyleDeclaration();
      new_computed_style_declaration.SetData(
        GetComputedStyleOfAnonymousBox(this.css_computed_style_declaration()));
//    new_computed_style_declaration->set_animations(
//        new web_animations::AnimationSet());
      let new_anonymous_block_box =
        new AnonymousBlockBox(new_computed_style_declaration, this.base_direction(),
          this.used_style_provider()/*, layout_stat_tracker()*/);
      anonymous_block_box = new_anonymous_block_box;
      this.PushBackDirectChild(new_anonymous_block_box);
    }
    return anonymous_block_box;
  }
}

// Often abbreviated as simply "blocks", block-level block container boxes
// participate in the block formatting context and are the most common form
// of block container boxes.
//   https://www.w3.org/TR/CSS21/visuren.html#block-boxes
//
// Although this class always establishes a block formatting context, it can
// nevertheless accommodate inline-level children through the creation
// of anonymous block boxes. When all children are inline-level this becomes
// slightly suboptimal from a memory standpoint but it simplifies
// the implementation and is conformance-neutral.
//   https://www.w3.org/TR/CSS21/visuren.html#anonymous-block-level
export class BlockLevelBlockContainerBox extends BlockFormattingBlockContainerBox {
  // From |Box|.
  GetLevel(): Level {
    return Level.kBlockLevel;
  }
  DumpClassName(stream: string): string {
    stream += 'BlockLevelBlockContainerBox ';
    return stream;
  }
};

// Non-replaced inline-block elements generate block container boxes that
// participate in the inline formatting context as a single opaque box. They
// belong to a wider group called atomic inline-level boxes.
//   https://www.w3.org/TR/CSS21/visuren.html#inline-boxes
//
// Although this class always establishes a block formatting context, it can
// nevertheless accommodate inline-level children through the creation
// of anonymous block boxes. When all children are inline-level this becomes
// slightly suboptimal from a memory standpoint but it simplifies
// the implementation and is conformance-neutral.
//   https://www.w3.org/TR/CSS21/visuren.html#anonymous-block-level
// class InlineLevelBlockContainerBox extends BlockFormattingBlockContainerBox {
//   InlineLevelBlockContainerBox(
//       const scoped_refptr<cssom::CSSComputedStyleDeclaration>&
//           css_computed_style_declaration,
//       BaseDirection base_direction, const scoped_refptr<Paragraph>& paragraph,
//       int32 text_position, UsedStyleProvider* used_style_provider,
//       LayoutStatTracker* layout_stat_tracker);
//
//   // From |Box|.
//   Level GetLevel() const override;
//
//   WrapResult TryWrapAt(WrapAtPolicy wrap_at_policy,
//                        WrapOpportunityPolicy wrap_opportunity_policy,
//                        bool is_line_existence_justified,
//                        LayoutUnit available_width,
//                        bool should_collapse_trailing_white_space) override;
//
//   base::Optional<int> GetBidiLevel() const override;
//
//   bool DoesFulfillEllipsisPlacementRequirement() const override;
//   void DoPreEllipsisPlacementProcessing() override;
//   void DoPostEllipsisPlacementProcessing() override;
//   bool IsHiddenByEllipsis() const override;
//
//
//  private:
//   // From |Box|.
//   void DoPlaceEllipsisOrProcessPlacedEllipsis(
//       BaseDirection base_direction, LayoutUnit desired_offset,
//       bool* is_placement_requirement_met, bool* is_placed,
//       LayoutUnit* placed_offset) override;
//
//   const scoped_refptr<Paragraph> paragraph_;
//   int32 text_position_;
//
//   // This flag indicates that the box is fully hidden by the ellipsis and it,
//   // along with its contents will not be visible.
//   // "Implementations must hide characters and atomic inline-level elements at
//   // the applicable edge(s) of the line as necessary to fit the ellipsis."
//   //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
//   bool is_hidden_by_ellipsis_;
//   // Tracking of the previous value of |is_hidden_by_ellipsis_|, which allows
//   // for determination of whether or not the value changed during ellipsis
//   // placement. When this occurs, the cached render tree nodes of this box and
//   // its ancestors are invalidated.
//   bool was_hidden_by_ellipsis_;
// };
