import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import {
  GetTransformOrigin,
  GetUsedBorderBottom,
  GetUsedBorderLeft,
  GetUsedBorderRight,
  GetUsedBorderTop,
  GetUsedColor,
  GetUsedLength,
  GetUsedNonNegativeLength,
  GetUsedPaddingBottom,
  GetUsedPaddingLeft,
  GetUsedPaddingRight,
  GetUsedPaddingTop,
  UsedBorderRadiusProvider,
  UsedStyleProvider
} from './used_style';
import { Vector2dF } from '../math/vector2d_f';
import { Node } from '../render_tree/node';
import { Node as DOMNode } from '../dom/node';
import { Vector2dLayoutUnit } from './vector2d_layout_unit';
import { InsetsLayoutUnit } from './insets_layout_unit';
import { SizeLayoutUnit } from './size_layout_unit';
import { BaseDirection } from './base_direction';
import { LayoutUnit } from './layout_unit';
import { KeywordValue } from '../cssom/keyword_value';
import { DCHECK } from '@neditor/core/base/check';
import { RectLayoutUnit } from './rect_layout_unit';
import { Matrix3F } from '../math/matrix3_f';
import { TranslateMatrix } from '../math/transform_2d';
import { RectF } from '../math/rect_f';
import { IntegerValue } from '../cssom/integer_value';
import { CompositionNode, CompositionNodeBuilder } from '../render_tree/composition_node';
import { RoundedCorner, RoundedCorners } from '../render_tree/rounded_corners';
import { InsetsF } from '../math/insets_f';
import { PointAtOffsetFromOrigin, PointF } from '../math/point_f';
import { RectNode, RectNodeBuilder } from '../render_tree/rect_node';
import { ClearRectNode } from '../render_tree/clear_rect_node';
import { PropertyValue } from '../cssom/property_value';
import { Optional } from '@neditor/core/base/common/typescript';
import { ComputedStyleData } from '../cssom/computed_style_data';
import { SolidColorBrush } from '../render_tree/brush';
import { TransformPropertyValue } from '../cssom/transform_property_value';
import { Border, BorderSide, BorderStyle } from '../render_tree/border';
import { DCHECK_EQ } from '@neditor/core/base/check_op';
import { ContainerBox } from './container_box';
import { BlockContainerBox } from './block_container_box';
import { AnonymousBlockBox } from './anonymous_block_box';
import { WrapAtPolicy, WrapOpportunityPolicy, WrapResult } from './line_wrapping';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { Serializer } from '../dom/serializer';
import { NumberValue } from '../cssom/number_value';
import { IsOverflowCropped } from '../cssom/computed_style_utils';
import { PropertyListValue } from '../cssom/property_list_value';
import { ShadowValue } from '../cssom/shadow_value';
import { Shadow } from '../render_tree/shadow';
import { Trait } from '../cssom/transform_function';
import { MatrixTransformNode } from '../render_tree/matrix_transform_node';
import type { TextBox } from './text_box';
import { MapCoordinatesFlags } from './map_coordinates_flags';
import { QuadF } from '../math/quad_f';
import { PointLayoutUnit } from './point_layout_unit';
import { Disposable, IDisposable } from '../../base/common/lifecycle';
import { LayoutObject } from './layout_object';
import type { InlineContainerBox } from './inline_container_box';

export enum Level {
  // The "block" value of the "display" property makes an element block-level.
  // Block-level boxes participate in a block formatting context.
  //   https://www.w3.org/TR/CSS21/visuren.html#block-boxes
  kBlockLevel,

  // The "inline" and "inline-block" values of the "display" property make
  // an element inline-level. Inline-level boxes that participate in an inline
  // formatting context.
  //   https://www.w3.org/TR/CSS21/visuren.html#inline-boxes
  kInlineLevel,
};

export enum MarginCollapsingStatus {
  kCollapseMargins,
  kIgnore,
  kSeparateAdjoiningMargins,
};

export enum RelationshipToBox {
  kIsBoxAncestor,
  kIsBox,
  kIsBoxDescendant,
};

export enum TransformAction {
  kEnterTransform,
  kExitTransform,
};

// Info tracked on container boxes encountered when a stacking context is
// generating its cross references.
export class StackingContextContainerBoxInfo {
  public is_usable_as_child_container: boolean;
  constructor(
    public container_box: ContainerBox,
    public is_absolute_containing_block: boolean,
    public has_absolute_position: boolean,
    public has_overflow_hidden: boolean,
  ) {
    this.is_usable_as_child_container = is_absolute_containing_block;
  }
}

export type  StackingContextContainerBoxStack = StackingContextContainerBoxInfo[]
// List of containing blocks with overflow hidden property. Used by stacking
// context children that are added to a stacking context container higher up
// the tree than their containing block, so that they can still have the
// overflow hidden from those containing blocks applied.
export type ContainingBlocksWithOverflowHidden = ContainerBox[]

// The RenderSequence of a box is used to compare the relative drawing order
// of boxes. It stores a value for the box's drawing order position at each
// stacking context up to the root of the render tree. As a result, starting
// from the root ancestor, the box for which the render sequence ends first,
// or for which the draw order position at a stacking context is lower is
// drawn before the other box.
export type RenderSequence = number[]

class CachedRenderTreeNodeInfo {
  node_?: Node;
  constructor(
    public offset_: Vector2dF
  ) {
  }
}

export type  Boxes = Box[]

export class LayoutParams {
  // Normally the used values of "width", "margin-left", and "margin-right" are
  // calculated by choosing the 1 out of 10 algorithms based on the computed
  // values of "display", "position", "overflow", and the fact whether the box
  // is replaced or not, as per:
  // https://www.w3.org/TR/CSS21/visudet.html#Computing_widths_and_margins
  //
  // If this flag is set, block container boxes will follow the algorithm
  // for inline-level, non-replaced block container boxes, which involves
  // the calculation of shrink-to-fit width, as per:
  // https://www.w3.org/TR/CSS21/visudet.html#inlineblock-width
  //
  // This override is used during the first pass of layout to calculate
  // the content size of "inline-block" elements. It's an equivalent of
  // "trying all possible line breaks", as described by:
  // https://www.w3.org/TR/CSS21/visudet.html#shrink-to-fit-float
  shrink_to_fit_width_forced = false;

  // These overrides are used for flex items when they are sized by the
  // container.
  freeze_width = false;
  freeze_height = false;

  // Many box positions and sizes are calculated with respect to the edges of
  // a rectangular box called a containing block.
  //   https://www.w3.org/TR/CSS21/visuren.html#containing-block
  containing_block_size: SizeLayoutUnit = new SizeLayoutUnit();

  // Margin calculations can depend on the direction property of the containing
  // block.
  //   https://www.w3.org/TR/CSS21/visudet.html#blockwidth
  containing_block_direction = BaseDirection.kLeftToRightBaseDirection;

  EQ(rhs: LayoutParams) {
    return this.shrink_to_fit_width_forced === rhs.shrink_to_fit_width_forced
      && this.freeze_height == rhs.freeze_height
      && this.freeze_width == rhs.freeze_width
      && this.containing_block_size!.EQ(rhs.containing_block_size!)
      && this.containing_block_direction === rhs.containing_block_direction;
  }
  maybe_margin_top?: LayoutUnit;
  maybe_margin_bottom?: LayoutUnit;
  maybe_height?: LayoutUnit;
}

interface RenderAndAnimateBackgroundImageResult {
  // The node representing the background image (may be a CompositionNode if
  // there are multiple layers).
  node: Node;
  // Returns whether the background image opaquely fills the entire frame.
  // If true, then we don't need to even consider rendering the background
  // color, since it will be occluded by the image.
  is_opaque: boolean;
}

export abstract class Box extends Disposable {
  // The css_computed_style_declaration_ member references the
  // cssom::CSSComputedStyleDeclaration object owned by the HTML Element from
  // which this box is derived.
  css_computed_style_declaration_: ComputedStyleDeclaration;
  used_style_provider_: UsedStyleProvider;
  // The parent of this box is the box that owns this child and is the direct
  // parent.  If DOM element A is a parent of DOM element B, and box A is
  // derived from DOM element A and box B is derived from DOM element B, then
  // box A will be the parent of box B.
  parent_?: ContainerBox;
  // Used values of "left" and "top" properties.
  margin_box_offset_from_containing_block_: Vector2dLayoutUnit = new Vector2dLayoutUnit();

  // The following static position variables are only used with absolutely
  // positioned boxes.
  // https://www.w3.org/TR/CSS21/visuren.html#absolute-positioning
  // The static position for 'left' is the distance from the left edge of the
  // containing block to the left margin edge of a hypothetical box that would
  // have been the first box of the element if its 'position' property had been
  // 'static' and 'float' had been 'none'. The value is negative if the
  // hypothetical box is to the left of the containing block.
  //   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-width
  // The static position for 'right' is the distance from the right edge of the
  // containing block to the right margin edge of the same hypothetical box as
  // above. The value is positive if the hypothetical box is to the left of the
  // containing block's edge.
  //   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-width
  // For the purposes of this section and the next, the term "static position"
  // (of an element) refers, roughly, to the position an element would have had
  // in the normal flow. More precisely, the static position for 'top' is the
  // distance from the top edge of the containing block to the top margin edge
  // of a hypothetical box that would have been the first box of the element if
  // its specified 'position' value had been 'static'.
  //   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-height
  static_position_offset_from_parent_: InsetsLayoutUnit = new InsetsLayoutUnit();
  static_position_offset_from_containing_block_to_parent_: InsetsLayoutUnit = new InsetsLayoutUnit();

  // Used values of "margin-left", "margin-top", "margin-right",
  // and "margin-bottom".
  protected readonly margin_insets_: InsetsLayoutUnit = new InsetsLayoutUnit();
  // Used values of "border-left-width", "border-top-width",
  // "border-right-width", and "border-bottom-width".
  border_insets_: InsetsLayoutUnit = new InsetsLayoutUnit();
  // Used values of "padding-left", "padding-top", "padding-right",
  // and "padding-bottom".
  padding_insets_: InsetsLayoutUnit = new InsetsLayoutUnit();
  // Used values of "width" and "height" properties.
  content_size_: SizeLayoutUnit = new SizeLayoutUnit();

  // Referenced and updated by ValidateUpdateSizeInputs() to memoize the
  // parameters we were passed during in last call to UpdateSizes().
  last_update_size_params_?: LayoutParams;

  // Render tree node caching is used to prevent the node from needing to be
  // recalculated during each call to RenderAndAnimateContent.
  cached_render_tree_node_info_?: CachedRenderTreeNodeInfo;

  // A value that indicates the drawing order relative to other boxes in the
  // same stacking context. Smaller values indicate boxes that are drawn
  // earlier.
  draw_order_position_in_stacking_context_: number;

  // Determines whether the background should be rendered as a clear (i.e. with
  // blending disabled).  It is expected that this may only be set on the
  // initial containing block.
  blend_background_color_ = true;

  collapsed_margin_top_?: LayoutUnit;
  collapsed_margin_bottom_?: LayoutUnit;
  collapsed_empty_margin_?: LayoutUnit;
  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    used_style_provider: UsedStyleProvider,
  ) {
    super();
    this.css_computed_style_declaration_ = css_computed_style_declaration;
    this.used_style_provider_ = used_style_provider;
    this.draw_order_position_in_stacking_context_ = 0;
  }

  // Computed style contains CSS values from the last stage of processing
  // before the layout. The computed value resolves the specified value as far
  // as possible without laying out the document or performing other expensive
  // or hard-to-parallelize operations, such as resolving network requests or
  // retrieving values other than from the element and its parent.
  //   https://www.w3.org/TR/css-cascade-3/#computed
  css_computed_style_declaration() {
    return this.css_computed_style_declaration_;
  }

  computed_style() {
    DCHECK(this.css_computed_style_declaration_.data());
    return this.css_computed_style_declaration_.data()!;
  }

// The animation set specifies all currently active animations applying
// to this box's computed_style() CSS Style Declaration.
//   https://w3c.github.io/web-animations
//  const web_animations::AnimationSet* animations() const {
//    return css_computed_style_declaration_.animations().get();
//  }

// Specifies the formatting context in which the box should participate.
// Do not confuse with the formatting context that the element may establish.
  abstract GetLevel(): Level

  // Poor man's reflection.
  AsAnonymousBlockBox(): Optional<AnonymousBlockBox> {
    return undefined;
  }
  AsBlockContainerBox(): Optional<BlockContainerBox> {
    return undefined;
  }
  AsContainerBox(): Optional<ContainerBox> {
    return undefined;
  }
  isTextBox(): this is TextBox {
    return false;
  }
  AsTextBox(): Optional<TextBox> {
    return undefined;
  }
  AsInlineContainerBox(): Optional<InlineContainerBox> {
    return undefined;
  }

  GetMarginCollapsingStatus(): MarginCollapsingStatus {
    return MarginCollapsingStatus.kCollapseMargins;
  }

// Returns true if the box is positioned (e.g. position is non-static or
// transform is not None).  Intuitively, this is true if the element does
// not follow standard layout flow rules for determining its position.
//   https://www.w3.org/TR/CSS21/visuren.html#positioned-element.
  IsPositioned(): boolean {
    return this.computed_style()!.IsPositioned();
  }

// Returns true if the box has a non-"none" value for its transform property.
//   https://www.w3.org/TR/css3-transforms/#transform-property
  IsTransformed() {
    return this.computed_style()!.IsTransformed();
  }

// Absolutely positioned box implies that the element's "position" property
// has the value "absolute" or "fixed".
//   https://www.w3.org/TR/CSS21/visuren.html#absolutely-positioned
  IsAbsolutelyPositioned() {
    return this.computed_style()!.position == KeywordValue.GetAbsolute() ||
      this.computed_style()!.position == KeywordValue.GetFixed();
  }
  // Whether or not the box is fully hidden by an ellipsis. This applies to
  // atomic inline-level elements that have had an ellipsis placed before them
  // on a line. https://www.w3.org/TR/css3-ui/#propdef-text-overflow
  IsHiddenByEllipsis(): boolean {
    return false;
  }

// Returns true if the box serves as a stacking context for descendant
// elements. The core stacking context creation criteria is given here
// (https://www.w3.org/TR/CSS21/visuren.html#z-index) however it is extended
// by various other specification documents such as those describing opacity
// (https://www.w3.org/TR/css3-color/#transparency) and transforms
// (https://www.w3.org/TR/css3-transforms/#transform-rendering).
  IsStackingContext() {
    return false;
  }

// Updates the size of margin, border, padding, and content boxes. Lays out
// in-flow descendants, estimates static positions (but not sizes) of
// out-of-flow descendants. Does not update the position of the box.
  UpdateSize(layout_params: LayoutParams) {
    if (this.ValidateUpdateSizeInputs(layout_params)) {
      return;
    }

    // If this point is reached, then the size of the box is being re-calculated.
    // layout_stat_tracker_->OnUpdateSize();

    this.UpdateBorders();
    this.UpdatePaddings(layout_params);
    this.UpdateContentSizeAndMargins(layout_params);

    // After a size update, this portion of the render tree must be updated, so
    // invalidate any cached render tree nodes.
    this.InvalidateRenderTreeNodesOfBoxAndAncestors();
  }

  // Returns the offset from root to this box's containing block.
  GetContainingBlockOffsetFromRoot(
    transform_forms_root: boolean): Vector2dLayoutUnit {
    if (!this.parent_) {
      return new Vector2dLayoutUnit();
    }

    let containing_block: ContainerBox = this.GetContainingBlock();
    return containing_block.GetContentBoxOffsetFromRoot(transform_forms_root).ADD(
      this.GetContainingBlockOffsetFromItsContentBox(containing_block)
    );

  }

  // Returns the offset from the containing block (which can be either the
  // containing block's content box or padding box) to its content box.
  GetContainingBlockOffsetFromItsContentBox(containing_block: ContainerBox): Vector2dLayoutUnit {
    DCHECK(containing_block == this.GetContainingBlock());
    // If the box is absolutely positioned, then its containing block is formed by
    // the padding box instead of the content box, as described in
    // http://www.w3.org/TR/CSS21/visudet.html#containing-block-details.
    // NOTE: While not explicitly stated in the spec, which specifies that the
    // containing block of a 'fixed' position element must always be the viewport,
    // all major browsers use the padding box of a transformed ancestor as the
    // containing block for 'fixed' position elements.
    return this.IsAbsolutelyPositioned()
      ? containing_block.GetContentBoxOffsetFromPaddingBox().NEG()
      : new Vector2dLayoutUnit();
  }
  GetContainingBlockInsetFromItsContentBox(
    containing_block: ContainerBox): InsetsLayoutUnit {
    // NOTE: Bottom inset is not computed and should not be queried.
    DCHECK(containing_block == this.GetContainingBlock());
    // If the box is absolutely positioned, then its containing block is formed by
    // the padding box instead of the content box, as described in
    // http://www.w3.org/TR/CSS21/visudet.html#containing-block-details.
    // NOTE: While not explicitly stated in the spec, which specifies that the
    // containing block of a 'fixed' position element must always be the viewport,
    // all major browsers use the padding box of a transformed ancestor as the
    // containing block for 'fixed' position elements.
    return this.IsAbsolutelyPositioned()
      ? new InsetsLayoutUnit(containing_block.padding_left().NEG(),
        containing_block.padding_top().NEG(),
        containing_block.padding_right().NEG(),
        new LayoutUnit())
      : new InsetsLayoutUnit();
  }

// Returns boxes relative to the root or containing block, that take into
// account transforms.
  GetTransformedBoxFromRoot(box_from_margin_box: RectLayoutUnit): RectLayoutUnit {
    return this.GetTransformedBoxFromContainingBlock(undefined, box_from_margin_box);
  }
//  GetTransformedBoxFromRootWithScroll(
//   box_from_margin_box: RectLayoutUnit) : RectLayoutUnit {
// }
  GetTransformedBoxFromContainingBlock(
    containing_block: ContainerBox | undefined,
    box_from_margin_box: RectLayoutUnit): RectLayoutUnit {
    return GetTransformedBox(
      this.GetMarginBoxTransformFromContainingBlock(containing_block),
      box_from_margin_box);
  }
  GetTransformedBoxFromContainingBlockContentBox(
    containing_block: ContainerBox,
    box_from_margin_box: RectLayoutUnit): RectLayoutUnit {
    return this.GetTransformedBoxFromContainingBlock(containing_block,
      box_from_margin_box).ADD(
      this.GetContainingBlockOffsetFromItsContentBox(containing_block)
    );
  }

// Used values of "left" and "top" are publicly readable and writable so that
// they can be calculated and adjusted by the formatting context of the parent
// box.
  set_left(left: LayoutUnit) {
    this.margin_box_offset_from_containing_block_.set_x(left);
  }
  left() {
    return this.margin_box_offset_from_containing_block_.x();
  }
  set_top(top: LayoutUnit) {
    this.margin_box_offset_from_containing_block_.set_y(top);
  }
  top() {
    return this.margin_box_offset_from_containing_block_.y();
  }

// The following static position functions are only used with absolutely
// positioned boxes.
// https://www.w3.org/TR/CSS21/visuren.html#absolute-positioning

// The static position for 'left' is the distance from the left edge of the
// containing block to the left margin edge of a hypothetical box that would
// have been the first box of the element if its 'position' property had been
// 'static' and 'float' had been 'none'. The value is negative if the
// hypothetical box is to the left of the containing block.
//   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-width
  SetStaticPositionLeftFromParent(left: LayoutUnit) {
    if (left.NE(this.static_position_offset_from_parent_.left())) {
      this.static_position_offset_from_parent_.set_left(left);
      // Invalidate the size if the static position offset changes, as the
      // positioning for absolutely positioned elements is handled within the size
      // update.
      this.InvalidateUpdateSizeInputsOfBox();
    }
  }
  SetStaticPositionLeftFromContainingBlockToParent(left: LayoutUnit) {
    if (left.NE(this.static_position_offset_from_containing_block_to_parent_.left())) {
      this.static_position_offset_from_containing_block_to_parent_.set_left(left);
      // Invalidate the size if the static position offset changes, as the
      // positioning for absolutely positioned elements is handled within the size
      // update.
      this.InvalidateUpdateSizeInputsOfBox();
    }
  }
  GetStaticPositionLeft(): LayoutUnit {
    DCHECK(this.IsAbsolutelyPositioned());
    return this.static_position_offset_from_parent_.left().ADD(
      this.static_position_offset_from_containing_block_to_parent_.left()
    );
  }

// The static position for 'right' is the distance from the right edge of the
// containing block to the right margin edge of the same hypothetical box as
// above. The value is positive if the hypothetical box is to the left of the
// containing block's edge.
//   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-width
  SetStaticPositionRightFromParent(right: LayoutUnit) {
    if (right.NE(this.static_position_offset_from_parent_.right())) {
      this.static_position_offset_from_parent_.set_right(right);
      // Invalidate the size if the static position offset changes, as the
      // positioning for absolutely positioned elements is handled within the size
      // update.
      this.InvalidateUpdateSizeInputsOfBox();
    }
  }
  SetStaticPositionRightFromContainingBlockToParent(right: LayoutUnit) {
    if (right.NE(this.static_position_offset_from_containing_block_to_parent_.right())) {
      this.static_position_offset_from_containing_block_to_parent_.set_right(right);
      // Invalidate the size if the static position offset changes, as the
      // positioning for absolutely positioned elements is handled within the size
      // update.
      this.InvalidateUpdateSizeInputsOfBox();
    }
  }
  GetStaticPositionRight(): LayoutUnit {
    DCHECK(this.IsAbsolutelyPositioned());
    return this.static_position_offset_from_parent_.right().ADD(this.static_position_offset_from_containing_block_to_parent_.right());
  }

// For the purposes of this section and the next, the term "static position"
// (of an element) refers, roughly, to the position an element would have had
// in the normal flow. More precisely, the static position for 'top' is the
// distance from the top edge of the containing block to the top margin edge
// of a hypothetical box that would have been the first box of the element if
// its specified 'position' value had been 'static'.
//   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-height
  SetStaticPositionTopFromParent(top: LayoutUnit) {
    if (top.NE(this.static_position_offset_from_parent_.top())) {
      this.static_position_offset_from_parent_.set_top(top);
      // Invalidate the size if the static position offset changes, as the
      // positioning for absolutely positioned elements is handled within the size
      // update.
      this.InvalidateUpdateSizeInputsOfBox();
    }
  }
  SetStaticPositionTopFromContainingBlockToParent(top: LayoutUnit) {
    if (top.NE(this.static_position_offset_from_containing_block_to_parent_.top())) {
      this.static_position_offset_from_containing_block_to_parent_.set_top(top);
      // Invalidate the size if the static position offset changes, as the
      // positioning for absolutely positioned elements is handled within the size
      // update.
      this.InvalidateUpdateSizeInputsOfBox();
    }
  }
  GetStaticPositionTop(): LayoutUnit {
    DCHECK(this.IsAbsolutelyPositioned());
    return this.static_position_offset_from_parent_.top().ADD(this.static_position_offset_from_containing_block_to_parent_.top());
  }

// Each box has a content area and optional surrounding padding, border,
// and margin areas.
//   https://www.w3.org/TR/CSS21/box.html#box-dimensions
//
// Methods below provide read-only access to dimensions and edges of margin,
// border, padding, and content boxes.

// Margin box.
  margin_left() {
    return this.margin_insets_.left();
  }
  margin_top() {
    return this.margin_insets_.top();
  }
  margin_right() {
    return this.margin_insets_.right();
  }
  margin_bottom() {
    return this.margin_insets_.bottom();
  }
  GetMarginBoxWidth() {
    return this.margin_left().ADD(this.GetBorderBoxWidth()).ADD(this.margin_right());
  }
  GetMarginBoxHeight() {
    return this.margin_top().ADD(this.GetBorderBoxHeight()).ADD(this.margin_bottom());
  } ;

// Used values of "margin" properties are set by overriders
// of |UpdateContentSizeAndMargins| method.
  set_margin_left(margin_left: LayoutUnit) {
    this.margin_insets_.set_left(margin_left);
  }
  set_margin_top(margin_top: LayoutUnit) {
    this.margin_insets_.set_top(margin_top);
  }
  set_margin_right(margin_right: LayoutUnit) {
    this.margin_insets_.set_right(margin_right);
  }
  set_margin_bottom(margin_bottom: LayoutUnit) {
    this.margin_insets_.set_bottom(margin_bottom);
  }

  GetMarginBoxTransformFromContainingBlock(containing_block: Optional<ContainerBox>): Matrix3F {
    let transform = Matrix3F.Identity();
    if (this == containing_block as Box) {
      return transform;
    }

    // Walk up the containing block tree to build the transform matrix.
    // The logic is similar to using ApplyTransformActionToCoordinate with exit
    // transform but a matrix is calculated instead; logic analogous to
    // GetMarginBoxOffsetFromRoot is also factored in.
    for (let box: Box = this; ;) {
      // Factor in the margin box offset.
      transform =
        TranslateMatrix(
          box.margin_box_offset_from_containing_block().x().toFloat(),
          box.margin_box_offset_from_containing_block().y().toFloat()).MUL(transform);
      // Factor in the box's transform.
      if (box.IsTransformed()) {
        let transform_rect_offset =
          box.margin_box_offset_from_containing_block().ADD(
            box.GetBorderBoxOffsetFromMarginBox()
          );
        transform =
          GetCSSTransform(box.computed_style()!.transform,
            box.computed_style()!.transform_origin,
            new RectF(transform_rect_offset.x().toFloat(),
              transform_rect_offset.y().toFloat(),
              box.GetBorderBoxWidth().toFloat(),
              box.GetBorderBoxHeight().toFloat())/*,
                          box.ComputeUiNavFocusForTransform()*/).MUL(transform);
      }

      let container = box.GetContainingBlock();
      if (container == containing_block || !container) {
        break;
      }

      // Convert the transform into the container's coordinate space.
      let containing_block_offset =
        box.GetContainingBlockOffsetFromItsContentBox(container).ADD(
          container.GetContentBoxOffsetFromMarginBox()
        );
      transform = TranslateMatrix(containing_block_offset.x().toFloat(),
        containing_block_offset.y().toFloat()).MUL(transform);

      // Factor in the container's scrollLeft / scrollTop as needed.
//    if (include_scroll && container.ui_nav_item_ &&
//        container.ui_nav_item_.IsContainer()) {
//      float left, top;
//      container.ui_nav_item_.GetContentOffset(&left, &top);
//      transform = math::TranslateMatrix(-left, -top) * transform;
//    }

      box = container;
    }

    return transform;
  }
  // GetMarginBoxTransformFromContainingBlockWithScroll(containing_block: ContainerBox): Matrix3F {}

  GetMarginBoxOffsetFromRoot(transform_forms_root: boolean): Vector2dLayoutUnit {
    let containing_block_offset_from_root =
      (!transform_forms_root || !this.IsTransformed())
        ? this.GetContainingBlockOffsetFromRoot(transform_forms_root)
        : new Vector2dLayoutUnit();
    return containing_block_offset_from_root.ADD(this.margin_box_offset_from_containing_block());
  }
  margin_box_offset_from_containing_block() {
    return this.margin_box_offset_from_containing_block_;
  }
  GetMarginBoxRightEdgeOffsetFromContainingBlock() {
    return this.left().ADD(this.GetMarginBoxWidth());
  }
  GetMarginBoxBottomEdgeOffsetFromContainingBlock() {
    return this.top().ADD(this.GetMarginBoxHeight());
  }
  GetMarginBoxStartEdgeOffsetFromContainingBlock(
    base_direction: BaseDirection) {
    return base_direction == BaseDirection.kRightToLeftBaseDirection
      ? this.GetMarginBoxRightEdgeOffsetFromContainingBlock()
      : this.left();
  }
  GetMarginBoxEndEdgeOffsetFromContainingBlock(
    base_direction: BaseDirection) {
    return base_direction == BaseDirection.kRightToLeftBaseDirection
      ? this.left()
      : this.GetMarginBoxRightEdgeOffsetFromContainingBlock();
  }

// Border box.
  border_left_width() {
    return this.border_insets_.left();
  }
  border_top_width() {
    return this.border_insets_.top();
  }
  border_right_width() {
    return this.border_insets_.right();
  }
  border_bottom_width() {
    return this.border_insets_.bottom();
  }

  GetBorderBoxFromRoot(transform_forms_root: boolean) {
    let border_box_offset = this.GetBorderBoxOffsetFromRoot(transform_forms_root);
    return new RectLayoutUnit(border_box_offset.x(), border_box_offset.y(),
      this.GetBorderBoxWidth(), this.GetBorderBoxHeight());
  }
  GetClientRect() {
    return this.GetBorderBoxFromRoot(false);
  }
  // Note that those functions have their origin at this box's CSS border box.
  // As such their location doesn't account for 'top'/'left'. About its
  // coordinate space, it can be treated as in either physical coordinates
  // or "physical coordinates in flipped block-flow direction", and
  // FlipForWritingMode() will do nothing on it.
  BorderBoxRect(): RectLayoutUnit {
    return new RectLayoutUnit(new PointLayoutUnit(), this.content_size_);
  }
  GetBorderBoxWidth() {
    return this.border_left_width().ADD(this.GetPaddingBoxWidth()).ADD(this.border_right_width());
  }
  GetBorderBoxHeight() {
    return this.border_top_width().ADD(this.GetPaddingBoxHeight()).ADD(this.border_bottom_width());
  }
  GetClampedBorderBoxSize() {
    // Border box size depends on the content, padding, and border areas
    // Its dimensions cannot be negative because the content, padding, and border
    // areas must be at least zero
    // (https://www.w3.org/TR/css-box-3/#the-css-box-model)
    return new SizeLayoutUnit(LayoutUnit.Max(new LayoutUnit(), this.GetBorderBoxWidth()),
      LayoutUnit.Max(new LayoutUnit(), this.GetBorderBoxHeight()));
  }

  GetBorderBoxFromMarginBox() {
    return new RectLayoutUnit(this.margin_left(), this.margin_top(), this.GetBorderBoxWidth(),
      this.GetBorderBoxHeight());
  }
  GetBorderBoxOffsetFromRoot(transform_forms_root: boolean) {
    return this.GetMarginBoxOffsetFromRoot(transform_forms_root).ADD(this.GetBorderBoxOffsetFromMarginBox());
  }
  GetBorderBoxOffsetFromMarginBox() {
    return new Vector2dLayoutUnit(this.margin_left(), this.margin_top());
  }

// Padding box.
  padding_left() {
    return this.padding_insets_.left();
  }
  padding_top() {
    return this.padding_insets_.top();
  }
  padding_right() {
    return this.padding_insets_.right();
  }
  padding_bottom() {
    return this.padding_insets_.bottom();
  }
  GetPaddingBoxWidth() {
    return this.padding_left().ADD(this.width()).ADD(this.padding_right());
  }
  GetPaddingBoxHeight() {
    return this.padding_top().ADD(this.height()).ADD(this.padding_bottom());
  }
  GetClampedPaddingBoxSize() {
    // Padding box size depends on the content and padding areas
    // Its dimensions cannot be negative because the content and padding areas
    // must be at least zero
    // (https://www.w3.org/TR/css-box-3/#the-css-box-model)
    return new SizeLayoutUnit(LayoutUnit.Max(new LayoutUnit(), this.GetPaddingBoxWidth()),
      LayoutUnit.Max(new LayoutUnit(), this.GetPaddingBoxHeight()));
  }

  GetPaddingBoxFromMarginBox() {
    return new RectLayoutUnit(this.GetPaddingBoxLeftEdgeOffsetFromMarginBox(),
      this.GetPaddingBoxTopEdgeOffsetFromMarginBox(),
      this.GetPaddingBoxWidth(), this.GetPaddingBoxHeight());
  }
  GetPaddingBoxOffsetFromRoot(
    transform_forms_root: boolean) {
    return this.GetBorderBoxOffsetFromRoot(transform_forms_root).ADD(this.GetPaddingBoxOffsetFromBorderBox());
  }
  GetPaddingBoxOffsetFromBorderBox() {
    return new Vector2dLayoutUnit(this.border_left_width(), this.border_top_width());
  }
  GetPaddingBoxLeftEdgeOffsetFromMarginBox() {
    return this.margin_left().ADD(this.border_left_width());
  }
  GetPaddingBoxTopEdgeOffsetFromMarginBox(): LayoutUnit {
    return this.margin_top().ADD(this.border_top_width());
  }

  SetPaddingInsets(left: LayoutUnit, top: LayoutUnit, right: LayoutUnit,
                   bottom: LayoutUnit) {
    this.padding_insets_.SetInsets(left, top, right, bottom);
  }

// Content box.
  width() {
    return this.content_size_.width();
  }
  height() {
    return this.content_size_.height();
  }
  content_box_size() {
    return this.content_size_;
  }

  GetContentBoxFromMarginBox() {
    return new RectLayoutUnit(this.GetContentBoxLeftEdgeOffsetFromMarginBox(),
      this.GetContentBoxTopEdgeOffsetFromMarginBox(), this.width(),
      this.height());
  }
  GetContentBoxOffsetFromRoot(transform_forms_root: boolean): Vector2dLayoutUnit {
    return this.GetMarginBoxOffsetFromRoot(transform_forms_root).ADD(this.GetContentBoxOffsetFromMarginBox());
  }
  GetContentBoxOffsetFromMarginBox() {
    return new Vector2dLayoutUnit(this.GetContentBoxLeftEdgeOffsetFromMarginBox(),
      this.GetContentBoxTopEdgeOffsetFromMarginBox());
  }
  GetContentBoxOffsetFromBorderBox() {
    return new Vector2dLayoutUnit(this.border_left_width().ADD(this.padding_left()),
      this.border_top_width().ADD(this.padding_top()));
  }
  GetContentBoxOffsetFromPaddingBox() {
    return new Vector2dLayoutUnit(this.padding_left(), this.padding_top());
  }
  GetContentBoxLeftEdgeOffsetFromMarginBox() {
    return this.margin_left().ADD(this.border_left_width()).ADD(this.padding_left());
  }
  GetContentBoxTopEdgeOffsetFromMarginBox() {
    return this.margin_top().ADD(this.border_top_width()).ADD(this.padding_top());
  }
  GetContentBoxOffsetFromContainingBlockContentBox(
    containing_block: ContainerBox) {
    return this.GetContainingBlockOffsetFromItsContentBox(containing_block).ADD(this.GetContentBoxOffsetFromContainingBlock());
  }
  GetContentBoxInsetFromContainingBlockContentBox(
    containing_block: ContainerBox) {
    // NOTE: Bottom inset is not computed and should not be queried.
    return this.GetContainingBlockInsetFromItsContentBox(containing_block).ADD(this.GetContentBoxInsetFromContainingBlock(containing_block));
  }
  GetContentBoxOffsetFromContainingBlock() {
    return new Vector2dLayoutUnit(this.GetContentBoxLeftEdgeOffsetFromContainingBlock(),
      this.GetContentBoxTopEdgeOffsetFromContainingBlock());
  }
  GetContentBoxInsetFromContainingBlock(
    containing_block: ContainerBox) {
    // NOTE: Bottom inset is not computed and should not be queried.
    let left_inset =
      this.left().ADD(this.margin_right()).ADD(this.border_left_width()).ADD(this.padding_left());
    return new InsetsLayoutUnit(
      left_inset, this.top().ADD(this.margin_top()).ADD(this.border_top_width()).ADD(this.padding_top()),
      containing_block.width().SUB(left_inset).SUB(this.width()), new LayoutUnit());
  }
  GetContentBoxLeftEdgeOffsetFromContainingBlock() {
    return this.left().ADD(this.GetContentBoxLeftEdgeOffsetFromMarginBox());
  }
  GetContentBoxTopEdgeOffsetFromContainingBlock() {
    return this.top().ADD(this.GetContentBoxTopEdgeOffsetFromMarginBox());
  }
  GetContentBoxStartEdgeOffsetFromContainingBlock(
    base_direction: BaseDirection) {
    return base_direction == BaseDirection.kRightToLeftBaseDirection
      ? this.GetContentBoxLeftEdgeOffsetFromContainingBlock().ADD(this.width())
      : this.GetContentBoxLeftEdgeOffsetFromContainingBlock();
  }
  GetContentBoxEndEdgeOffsetFromContainingBlock(
    base_direction: BaseDirection) {
    return base_direction == BaseDirection.kRightToLeftBaseDirection
      ? this.GetContentBoxLeftEdgeOffsetFromContainingBlock()
      : this.GetContentBoxLeftEdgeOffsetFromContainingBlock().ADD(this.width());
  }

// Return the size difference between the content and margin box on an axis.
  GetContentToMarginHorizontal() {
    return this.margin_left().ADD(this.border_left_width()).ADD(this.padding_left())
      .ADD(this.padding_right()).ADD(this.border_right_width()).ADD(this.margin_right());
  }
  GetContentToMarginVertical() {
    return this.margin_top().ADD(this.border_top_width()).ADD(this.padding_top()).ADD(this.padding_bottom())
      .ADD(this.border_bottom_width()).ADD(this.margin_bottom());
  }

// The height of each inline-level box in the line box is calculated. For
// replaced elements, inline-block elements, and inline-table elements, this
// is the height of their margin box; for inline boxes, this is their
// 'line-height'.
//   http://www.w3.org/TR/CSS21/visudet.html#line-height
  GetInlineLevelBoxHeight(): LayoutUnit {
    return this.GetMarginBoxHeight();
  }
  GetInlineLevelTopMargin(): LayoutUnit {
    return new LayoutUnit();
  }

// When an element is blockified, that should not affect the static position.
//   https://www.w3.org/TR/CSS21/visudet.html#abs-non-replaced-width
//   https://www.w3.org/TR/CSS21/visuren.html#dis-pos-flo
// Return true if the element's outer display type was inline before any
// optional blockificiation has occurred.
  is_inline_before_blockification(): boolean {
    return this.css_computed_style_declaration_.data()!.is_inline_before_blockification();
  }

// Attempts to wrap the box based upon the provided wrap policies.
// If |is_line_existence_justified| is true, then the line does not require
// additional content before wrapping is possible. Otherwise, content
// justifying the line must be encountered first.
// |available_width| indicates the amount of width remaining on the line
// before the boxes overflow it.
// If |should_collapse_trailing_white_space| is true, the trailing whitespace
// of the box will be collapsed and should not be included in width
// calculations.
//
// Returns the result of the wrap attempt. If the result is
// |kWrapResultSplitWrap|, then the box has been split, and the portion of the
// box split from the initial box is available via GetSplitSibling().
//
// Note that only inline boxes are wrappable.
  abstract TryWrapAt(
    wrap_at_policy: WrapAtPolicy,
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean): WrapResult

// Returns the next box in a linked list of sibling boxes produced from
// splits of the original box.
//
// Note that only inline boxes are splittable. All other box types will return
// NULL.
  GetSplitSibling(): Optional<Box> {
    return undefined;
  }

// Verifies that either an ellipsis can be placed within the box, or that an
// ellipsis has already been placed in a previous box in the line, and calls
// DoPlaceEllipsisOrProcessPlacedEllipsis() to handle ellipsis placement and
// updating of ellipsis-related state within the box. It also sets
// |is_placement_requirement_met| to true if the box fulfills the requirement
// that the first character or atomic inline-level element must appear on a
// line before an ellipsis
// (https://www.w3.org/TR/css3-ui/#propdef-text-overflow), regardless of
// whether or not the ellipsis can be placed within this specific box.
  TryPlaceEllipsisOrProcessPlacedEllipsis(
    base_direction: BaseDirection,
    desired_offset: LayoutUnit,
    is_placement_requirement_met: boolean,
    is_placed: boolean,
    placed_offset: LayoutUnit,
  ): { is_placement_requirement_met: boolean, is_placed: boolean, placed_offset: LayoutUnit } {
// Ellipsis placement should only occur in inline level boxes.
    DCHECK(this.GetLevel() == Level.kInlineLevel);

    // Check for whether this box or a previous box meets the placement
    // requirement that the first character or atomic inline-level element on a
    // line must appear before the ellipsis
    // (https://www.w3.org/TR/css3-ui/#propdef-text-overflow).
    // NOTE: 'Meet' is used in this context to to indicate that either this box or
    // a previous box within the line fulfilled the placement requirement.
    // 'Fulfill' only refers to the specific box and does not take into account
    // previous boxes within the line.
    let box_meets_placement_requirement =
      is_placement_requirement_met ||
      this.DoesFulfillEllipsisPlacementRequirement();

    // If the box was already placed or meets the placement requirement and the
    // desired offset comes before the margin box's end edge, then set the flag
    // indicating that DoPlaceEllipsisOrProcessPlacedEllipsis() should be called.
    let should_place_ellipsis_or_process_placed_ellipsis;
    if (is_placed) {
      should_place_ellipsis_or_process_placed_ellipsis = true;
    } else if (box_meets_placement_requirement) {
      let end_offset =
        this.GetMarginBoxEndEdgeOffsetFromContainingBlock(base_direction);
      should_place_ellipsis_or_process_placed_ellipsis =
        base_direction == BaseDirection.kRightToLeftBaseDirection
          ? desired_offset.GE(end_offset)
          : desired_offset.LE(end_offset);
    } else {
      should_place_ellipsis_or_process_placed_ellipsis = false;
    }

    // If the flag is set, call DoPlaceEllipsisOrProcessPlacedEllipsis(), which
    // handles both determining the actual placement position and updating the
    // ellipsis-related box state. While the box meeting the placement requirement
    // is included in the initial check, it is not included in
    // DoPlaceEllipsisOrProcessPlacedEllipsis(), as
    // DoPlaceEllipsisOrProcessPlacedEllipsis() needs to know whether or not the
    // placement requirement was met in a previous box.
    if (should_place_ellipsis_or_process_placed_ellipsis) {
      let {
        is_placed: is_placed_result,
        is_placement_requirement_met: is_placement_requirement_met_result,
        placed_offset: placed_offset_result
      } = this.DoPlaceEllipsisOrProcessPlacedEllipsis(base_direction, desired_offset,
        is_placement_requirement_met,
        is_placed, placed_offset);
      is_placed = is_placed_result;
      is_placement_requirement_met = is_placement_requirement_met_result;
      placed_offset = placed_offset_result;
    }

    // Update |is_placement_requirement_met| with whether or not this box met
    // the placement requirement, so that later boxes will know that they don't
    // need to fulfill it themselves.
    is_placement_requirement_met = box_meets_placement_requirement;
    return {
      is_placed,
      is_placement_requirement_met,
      placed_offset
    };
  }
// Whether or not the box fulfills the ellipsis requirement that it not be
// be placed until after the "the first character or atomic inline-level
// element on a line."
//   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
  DoesFulfillEllipsisPlacementRequirement() {
    return false;
  }
// Do any processing needed prior to ellipsis placement. This involves caching
// the old value and resetting the current value so it can be determined
// whether or not the ellipsis state within a box changed as a a result of
// ellipsis placement.
  DoPreEllipsisPlacementProcessing() {
  }
// Do any processing needed following ellipsis placement. This involves
// checking the old value against the new value and resetting the cached
// render tree node if the ellipsis state changed.
  DoPostEllipsisPlacementProcessing() {
  }
// Whether or not the box is fully hidden by an ellipsis. This applies to
// atomic inline-level elements that have had an ellipsis placed before them
// on a line. https://www.w3.org/TR/css3-ui/#propdef-text-overflow
// virtual bool IsHiddenByEllipsis() const { return false; }

// Initial splitting of boxes between bidi level runs prior to layout, so that
// they will not need to occur during layout.
  abstract SplitBidiLevelRuns(): void

// Attempt to split the box at the second level run within it.
// Returns true if a split occurs. The second box produced by the split is
// retrievable by calling GetSplitSibling().
// NOTE: The splits that occur at the intersection of bidi level runs is
// unrelated to line-wrapping and does not introduce wrappable locations.
// It is used to facilitate bidi level reordering of the boxes within a
// line.
  abstract TrySplitAtSecondBidiLevelRun(): boolean

// Retrieve the bidi level for the box, if it has one.
  abstract GetBidiLevel(): Optional<number>

// Sets whether a leading white space in the box or its first non-collapsed
// descendant should be collapsed.
  abstract SetShouldCollapseLeadingWhiteSpace(
    should_collapse_leading_white_space: boolean): void
// Sets whether a trailing white space in the box or its last non-collapsed
// descendant should be collapsed.
  abstract SetShouldCollapseTrailingWhiteSpace(
    should_collapse_trailing_white_space: boolean): void
// Whether the box or its first non-collapsed descendant starts with a white
// space.
//
// WARNING: undefined, unless the box's size is up-to-date.
  abstract HasLeadingWhiteSpace(): boolean
// Whether the box or its last non-collapsed descendant ends with a white
// space.
//
// WARNING: undefined, unless the box's size is up-to-date.
  abstract HasTrailingWhiteSpace(): boolean
// A box is collapsed if it has no text or white space, nor have its children.
// A collapsed box may still have a non-zero width. Atomic inline-level boxes
// are never collapsed, even if empty.
//
// This is used to decide whether two white spaces are following each other in
// an inline formatting context.
//
// WARNING: undefined, unless the box's size is up-to-date.
  abstract IsCollapsed(): boolean

// Line boxes that contain no text, no preserved white space, no inline
// elements with non-zero margins, padding, or borders, and no other in-flow
// content must be treated as zero-height line boxes for the purposes
// of determining the positions of any elements inside of them, and must be
// treated as not existing for any other purpose.
//   https://www.w3.org/TR/CSS21/visuren.html#inline-formatting
  abstract JustifiesLineExistence(): boolean
// Whether or not the box or its last descendant has a trailing line break,
// disallowing additional boxes on the same line.
  HasTrailingLineBreak(): boolean {
    return false;
  }
// Boxes that don't establish a baseline (such as empty blocks or lines)
// should not affect the baseline calculation in the block formatting context.
  abstract AffectsBaselineInBlockFormattingContext(): boolean
// Returns the vertical offset of the baseline relatively to the top margin
// edge. If the box does not have a baseline, returns the bottom margin edge,
// as per https://www.w3.org/TR/CSS21/visudet.html#line-height.
  abstract GetBaselineOffsetFromTopMarginEdge(): LayoutUnit

// Marks the current set of UpdateSize parameters (which includes the
// LayoutParams parameter as well as object member variable state) as valid.
// Returns true if previously calculated results from UpdateSize() are still
// valid.  This is used to aredundant recalculations, and is an extremely
// important optimization since it applies to all levels of the box hierarchy.
// Derived classes may override this method to check if local box state has
// changed as well.
  ValidateUpdateSizeInputs(params: LayoutParams): boolean {
    if (this.last_update_size_params_ && params == this.last_update_size_params_) {
      return true;
    } else {
      this.last_update_size_params_ = params;
      return false;
    }
  }

// Invalidating the sizes causes them to be re-calculated the next time they
// are needed.
  InvalidateUpdateSizeInputsOfBox() {
    this.last_update_size_params_ = undefined;
  }
  InvalidateUpdateSizeInputsOfBoxAndAncestors() {
    this.InvalidateUpdateSizeInputsOfBox();
    if (this.parent_) {
      this.parent_.InvalidateUpdateSizeInputsOfBoxAndAncestors();
    }
  }

// Invalidating the cross references causes them to be re-calculated the next
// time they are needed.
  InvalidateCrossReferencesOfBoxAndAncestors() {
    if (this.parent_) {
      this.parent_.InvalidateCrossReferencesOfBoxAndAncestors();
    }
  }

// Invalidating the render tree nodes causes them to be re-generated the next
// time they are needed.
  InvalidateRenderTreeNodesOfBoxAndAncestors() {
    this.cached_render_tree_node_info_ = undefined;
    if (this.parent_) {
      this.parent_.InvalidateRenderTreeNodesOfBoxAndAncestors();
    }
  }

// Converts a layout subtree into a render subtree.
// This method defines the overall strategy of the conversion and relies
// on the subclasses to provide the actual content.
  RenderAndAnimate(
    parent_content_node_builder: CompositionNodeBuilder,
    offset_from_parent_node: Vector2dF,
    stacking_context: ContainerBox): void {
    DCHECK(stacking_context);

    let border_box_offset = new Vector2dF(this.left().toFloat() + this.margin_left().toFloat(),
      this.top().toFloat() + this.margin_top().toFloat());
    border_box_offset.ADD_ASSIGN(offset_from_parent_node);

    // If there's a pre-existing cached render tree node that is located at the
    // border box offset, then simply use it. The only work that needs to be done
    // is adding the box and any ancestors that are contained within the stacking
    // context to the draw order of the stacking context.
    if (this.cached_render_tree_node_info_ &&
      this.cached_render_tree_node_info_.offset_ == border_box_offset) {
      if (this.cached_render_tree_node_info_.node_) {
        parent_content_node_builder.AddChild(
          this.cached_render_tree_node_info_.node_);
      }
      this.AddBoxAndDescendantsToDrawOrderInStackingContext(stacking_context);
      return;
    }

    this.draw_order_position_in_stacking_context_ =
      stacking_context.AddToDrawOrderInThisStackingContext();

    // If this point is reached, then the pre-existing cached render tree node is
    // not being used.
    // layout_stat_tracker_.OnRenderAndAnimate();

    // Initialize the cached render tree node with the border box offset.
    this.cached_render_tree_node_info_ = new CachedRenderTreeNodeInfo(border_box_offset);

    let opacity = (this.computed_style()!.opacity as NumberValue).value();
//  bool opacity_animated =
//      animations().IsPropertyAnimated(cssom::kOpacityProperty);
    let opacity_animated = false;
    if (opacity <= 0.0 && !opacity_animated) {
      // If the box has 0 opacity, and opacity is not animated, then we do not
      // need to proceed any farther, the box is invisible.
      return;
    }

    // If a box is hidden by an ellipsis, then it and its children are hidden:
    // Implementations must hide characters and atomic inline-level elements at
    // the applicable edge(s) of the line as necessary to fit the ellipsis.
    //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
    if (this.IsHiddenByEllipsis()) {
      return;
    }

    let border_node_builder = new CompositionNodeBuilder(border_box_offset);
//  AnimateNode::Builder animate_node_builder;

    let rounded_corners = this.ComputeRoundedCorners();

    let padding_rounded_corners = this.ComputePaddingRoundedCorners(rounded_corners);

    // Update intersection observers for any targets represented by this box.
//  if (box_intersection_observer_module_) {
//    box_intersection_observer_module_.UpdateIntersectionObservations();
//  }

    // The painting order is:
    // - background color.
    // - background image.
    // - border.
    //   https://www.w3.org/TR/CSS21/zindex.html
    //
    // TODO: Fully implement the stacking algorithm:
    //       https://www.w3.org/TR/CSS21/visuren.html#z-index and
    //       https://www.w3.org/TR/CSS21/zindex.html.

    // When an element has visibility:hidden, the generated box is invisible
    // (fully transparent, nothing is drawn), but still affects layout.
    // Furthermore, descendants of the element will be visible if they have
    // 'visibility: visible'.
    //   https://www.w3.org/TR/CSS21/visufx.html#propdef-visibility
    let box_is_visible =
      this.computed_style()!.visibility == KeywordValue.GetVisible();
    if (box_is_visible) {
      let background_image_result =
        this.RenderAndAnimateBackgroundImage(padding_rounded_corners);
      // If the background image is opaque, then it will occlude the background
      // color and so we do not need to render the background color.
      if (!background_image_result.is_opaque) {
        this.RenderAndAnimateBackgroundColor(
          padding_rounded_corners, border_node_builder/*, &animate_node_builder*/);
      }
      if (background_image_result.node) {
        border_node_builder.AddChild(background_image_result.node);
      }
      this.RenderAndAnimateBorder(rounded_corners, border_node_builder/*,
                           &animate_node_builder*/);
      this.RenderAndAnimateBoxShadow(rounded_corners, padding_rounded_corners,
        border_node_builder/*, &animate_node_builder*/);
    }

    let overflow_hidden = IsOverflowCropped(this.computed_style()!);

    let overflow_hidden_needs_to_be_applied = overflow_hidden;

    // If the outline is absent or transparent, there is no need to render it.
//  bool outline_is_visible =
//      box_is_visible &&
//      (computed_style().outline_style() != cssom::KeywordValue::GetNone() &&
//       computed_style().outline_style() != cssom::KeywordValue::GetHidden() &&
//       (animations().IsPropertyAnimated(cssom::kOutlineColorProperty) ||
//        GetUsedColor(computed_style().outline_color()).a() != 0.0f));
    let outline_is_visible =
      box_is_visible &&
      (this.computed_style()!.outline_style != KeywordValue.GetNone() &&
        this.computed_style()!.outline_style != KeywordValue.GetHidden() &&
        GetUsedColor(this.computed_style()!.outline_color).a() != 0.0);
    // In order to avoid the creation of a superfluous CompositionNode, we first
    // check to see if there is a need to distinguish between content and
    // background.
//  if (!overflow_hidden ||
//      (!IsOverflowAnimatedByUiNavigation() && !outline_is_visible &&
//       computed_style().box_shadow() == cssom::KeywordValue::GetNone() &&
//       border_insets_.zero())) {
    if (!overflow_hidden ||
      (!outline_is_visible &&
        this.computed_style()!.box_shadow == KeywordValue.GetNone() &&
        this.border_insets_.zero())) {
      // If there's no reason to distinguish between content and background,
      // just add them all to the same composition node.
      this.RenderAndAnimateContent(border_node_builder, stacking_context);
    } else {
      // Otherwise, deal with content specifically so that we can animate the
      // content offset for UI navigation and/or apply overflow: hidden to the
      // content but not the background.
      let content_node_builder = new CompositionNodeBuilder();
      this.RenderAndAnimateContent(content_node_builder, stacking_context);
      if (content_node_builder.children().length > 0) {
        let { rounded_corners, overflow_node } = this.RenderAndAnimateOverflow(
          padding_rounded_corners,
          new CompositionNode(content_node_builder),
          /*&animate_node_builder,*/ new Vector2dF(0, 0));
        padding_rounded_corners = rounded_corners;
        border_node_builder.AddChild(overflow_node);
      }
      // We've already applied overflow hidden, no need to apply it again later.
      overflow_hidden_needs_to_be_applied = false;
    }

    if (outline_is_visible) {
      this.RenderAndAnimateOutline(border_node_builder/*, &animate_node_builder*/);
    }

    if (border_node_builder.children().length > 0) {
      let border_node: Node =
        new CompositionNode(border_node_builder);
      if (overflow_hidden_needs_to_be_applied) {
        let { overflow_node, rounded_corners } = this.RenderAndAnimateOverflow(padding_rounded_corners, border_node,
          /*&animate_node_builder, */border_box_offset);
        padding_rounded_corners = rounded_corners;
        border_node = overflow_node;

      }
      border_node = this.RenderAndAnimateTransform(border_node, /*&animate_node_builder,*/
        border_box_offset);
      border_node = this.RenderAndAnimateOpacity(border_node, /*&animate_node_builder,*/
        opacity, opacity_animated);

//    cached_render_tree_node_info_.node_ =
//        animate_node_builder.empty()
//            ? border_node
//            : scoped_refptr<render_tree::Node>(
//                  new AnimateNode(animate_node_builder, border_node));
      DCHECK(this.cached_render_tree_node_info_);
      this.cached_render_tree_node_info_!.node_ = border_node;

      parent_content_node_builder.AddChild(this.cached_render_tree_node_info_!.node_);
    }
  }
//
// scoped_refptr<render_tree::Node> RenderAndAnimateOverflow(
// const scoped_refptr<render_tree::Node>& content_node,
// const math::Vector2dF& border_offset);

  parent(): Optional<ContainerBox> {
    return this.parent_ || undefined;
  }

  GetAbsoluteContainingBlock(): ContainerBox {
    // If the element has 'position: absolute', the containing block is
    // established by the nearest ancestor with a 'position' of 'absolute',
    // 'relative' or 'fixed'.
    if (!this.parent_) return this as unknown as ContainerBox;
    let containing_block: ContainerBox = this.parent_;
    while (containing_block && !containing_block.IsContainingBlockForPositionAbsoluteElements()) {
      containing_block = containing_block.parent_!;
    }
    return containing_block;
  }

  GetFixedContainingBlock(): ContainerBox {
    // If the element has 'position: fixed', the containing block is established
    // by the viewport in the case of continuous media or the page area in the
    // case of paged media.
    // Transformed elements also act as a containing block for fixed positioned
    // descendants, as described at the bottom of this section:
    // https://www.w3.org/TR/css-transforms-1/#transform-rendering.
    if (!this.parent_) return this as unknown as ContainerBox;
    let containing_block: ContainerBox = this.parent_;
    while (containing_block && !containing_block.IsContainingBlockForPositionFixedElements()) {
      containing_block = containing_block.parent_!;
    }
    return containing_block;
  }

  GetContainingBlock(): ContainerBox {
    // Establish the containing block, as described in
    // http://www.w3.org/TR/CSS21/visudet.html#containing-block-details.
    if (this.computed_style()!.position == KeywordValue.GetAbsolute()) {
      return this.GetAbsoluteContainingBlock();
    } else if (this.computed_style()!.position == KeywordValue.GetFixed()) {
      return this.GetFixedContainingBlock();
    }
    // If the element's position is "relative" or "static", the containing
    // block is formed by the content edge of the nearest block container
    // ancestor box.
    return this.parent_!;
  }

  GetStackingContext(): ContainerBox {
    if (!this.parent_) return this as unknown as ContainerBox;

    // If the box is an in-flow, non-positioned element, then simply return the
    // parent as the stacking context.
    //   https://www.w3.org/TR/CSS21/visuren.html#z-index
    if (!this.IsPositioned() && !this.IsStackingContext()) {
      return this.parent_;
    }

    let ancestor: ContainerBox = this.parent_;
    while (!ancestor.IsStackingContext()) {
      ancestor = ancestor.parent_!;
    }
    return ancestor;
  }

// Returns the z-index of this box, based on its computed style.
  GetZIndex(): number {
    if (this.computed_style()!.z_index == KeywordValue.GetAuto()) {
      return 0;
    } else {
      return (this.computed_style()!.z_index as IntegerValue).value();
    }
  }

// Returns the order value of this box, based on its computed style.
  GetOrder() {
    return (this.computed_style()!.order as IntegerValue).value();
  }

// Invalidates the parent of the box, used in box generation for partial
// layout.
  InvalidateParent() {
    this.parent_ = undefined;
  }

// Returns true if the box is positioned under the passed in coordinate.
  IsUnderCoordinate(coordinate: Vector2dLayoutUnit): boolean {
    let rect = this.GetBorderBoxFromRoot(true /*transform_forms_root*/);
    let res =
      coordinate.x().GE(rect.x()) && coordinate.x().LE(rect.x().ADD(rect.width())) &&
      coordinate.y().GE(rect.y()) && coordinate.y().LE(rect.y().ADD(rect.height()));
    return res;
  }

// Returns a data structure that can be used by Box::IsRenderedLater().
  GetRenderSequence(): RenderSequence {
    let render_sequence: RenderSequence = [];
    let ancestor_box: Box = this;
    let box: Box | undefined = undefined;
    while (ancestor_box && (box != ancestor_box)) {
      box = ancestor_box;
      if (box.cached_render_tree_node_info_) {
        render_sequence.push(box.draw_order_position_in_stacking_context_);
        ancestor_box = box.GetStackingContext();
      }
    }
    return render_sequence;
  }

// Returns true if the box for the given render_sequence is rendered after
// the box for the other_render_sequence. The boxes must be from the same
// layout tree.
  static IsRenderedLater(render_sequence: RenderSequence,
                         other_render_sequence: RenderSequence): boolean {
    for (let step = 1; step <= render_sequence.length; ++step) {
      if (other_render_sequence.length < step) {
        return true;
      }
      let idx = render_sequence.length - step;
      let other_idx = other_render_sequence.length - step;
      if (render_sequence[idx] != other_render_sequence[other_idx]) {
        return render_sequence[idx] > other_render_sequence[other_idx];
      }
    }
    return false;
  }

// Applies the specified transform action to the provided coordinates.
// Returns false if the transform is not invertible and the action requires
// it being inverted.
  ApplyTransformActionToCoordinate(action: TransformAction,
                                   coordinate: Vector2dF): boolean {
    let coordinate_vector: Vector2dF[] = [];
    coordinate_vector.push(coordinate);
    let result = this.ApplyTransformActionToCoordinates(action, coordinate_vector);
    // *coordinate = coordinate_vector[0];
    return result;
  }

  ApplyTransformActionToCoordinates(action: TransformAction,
                                    coordinates: Vector2dF[]): boolean {
    let transform =
      this.computed_style()!.transform;
    if (transform == KeywordValue.GetNone()) {
      return true;
    }

    // The border box offset is calculated in two steps because we want to
    // stop at the second transform and not the first (which is this box).
    let containing_block_offset_from_root =
      this.GetContainingBlockOffsetFromRoot(true /*transform_forms_root*/);

    // The transform rect always includes the offset from the containing block.
    // However, in the case where the action is entering the transform, the full
    // offset from the root needs to be included in the transform.
    let transform_rect_offset =
      this.margin_box_offset_from_containing_block().ADD(this.GetBorderBoxOffsetFromMarginBox());
    if (action == TransformAction.kEnterTransform) {
      transform_rect_offset.ADD_ASSIGN(containing_block_offset_from_root);
    }

    // Transform the coordinates.
    let matrix = GetCSSTransform(
      transform, this.computed_style()!.transform_origin,
      new RectF(transform_rect_offset.x().toFloat(),
        transform_rect_offset.y().toFloat(),
        this.GetBorderBoxWidth().toFloat(),
        this.GetBorderBoxHeight().toFloat())/*,
      ComputeUiNavFocusForTransform()*/);
    if (!matrix.IsIdentity()) {
      if (action == TransformAction.kEnterTransform) {
        matrix = matrix.Inverse();
        // The matrix is not invertible. Return that applying the transform
        // failed.
        if (matrix.IsZeros()) {
          return false;
        }
      }

      for (let coordinate of coordinates) {
        let transformed_point =
          matrix.MUL(new PointF(coordinate.x(), coordinate.y()));
        coordinate.set_x(transformed_point.x());
        coordinate.set_y(transformed_point.y());
      }
    }

    // The transformed box forms a new coordinate system and its containing
    // block's offset is the origin within it. Update the coordinates for their
    // new origin.
    let containing_block_offset_from_root_as_float = new Vector2dF(
      containing_block_offset_from_root.x().toFloat(),
      containing_block_offset_from_root.y().toFloat());
    for (let coordinate of coordinates) {
      if (action == TransformAction.kEnterTransform) {
        coordinate.SUB_ASSIGN(containing_block_offset_from_root_as_float);
      } else {
        coordinate.ADD_ASSIGN(containing_block_offset_from_root_as_float);
      }
    }
    return true;
  }

// Intended to be set to false on the initial containing block, this indicates
// that when the background color is rendered, it will be blended with what,
// is behind it (only relevant when the color is not opaque). As an example,
// if set to false, a background color of transparent will replace any
// previous pixel values instead of being a no-op.
  set_blend_background_color(value: boolean) {
    this.blend_background_color_ = value;
  }

// Configure the box's UI navigation item with the box's position, size, etc.
//  UpdateUiNavigationItem();

//  SetUiNavItem(const scoped_refptr<ui_navigation::NavItem>& item) {
//    ui_nav_item_ = item;
//  }

//  AddIntersectionObserverRootsAndTargets(
//      BoxIntersectionObserverModule::IntersectionObserverRootVector&& roots,
//      BoxIntersectionObserverModule::IntersectionObserverTargetVector&&
//          targets);
//  bool ContainsIntersectionObserverRoot(
//      const scoped_refptr<IntersectionObserverRoot>& intersection_observer_root)
//

  used_style_provider() {
    return this.used_style_provider_;
  }

//  layout_stat_tracker()  {
//   return this.layout_stat_tracker_;
// }

// Updates used values of "width", "height", and "margin" properties based on
// https://www.w3.org/TR/CSS21/visudet.html#Computing_widths_and_margins and
// https://www.w3.org/TR/CSS21/visudet.html#Computing_heights_and_margins.
// Limits set by "min-width" and "max-width" are honored for non-replaced
// boxes, based on https://www.w3.org/TR/CSS21/visudet.html#min-max-widths.
  abstract UpdateContentSizeAndMargins(layout_params: LayoutParams): void;

// Content box setters.
//
// Used values of "width" and "height" properties are set by overriders
// of |UpdateContentSizeAndMargins| method.
  set_width(width: LayoutUnit) {
    this.content_size_.set_width(width);
  }
  set_height(height: LayoutUnit) {
    this.content_size_.set_height(height);
  }

// Used to determine whether this box justifies the existence of a line,
// as per:
//
// Line boxes that contain no inline elements with non-zero margins, padding,
// or borders must be treated as not existing.
//   https://www.w3.org/TR/CSS21/visuren.html#phantom-line-box
  HasNonZeroMarginOrBorderOrPadding() {
    return this.width().NE(this.GetMarginBoxWidth()) || this.height().NE(this.GetMarginBoxHeight());
  }

// Add a box and all of its descendants that are contained within the
// specified stacking context to the stacking context's draw order. This is
// used when a render tree node that is already cached is encountered to
// ensure that it maintains the proper draw order in its stacking context.
  AddBoxAndDescendantsToDrawOrderInStackingContext(
    stacking_context: ContainerBox) {
    DCHECK(stacking_context == this.GetStackingContext());
    this.draw_order_position_in_stacking_context_ =
      stacking_context.AddToDrawOrderInThisStackingContext();
  }

// Renders the content of the box.
  abstract RenderAndAnimateContent(
    border_node_builder: CompositionNodeBuilder,
    stacking_context: ContainerBox): void;

// A transformable element is an element whose layout is governed by the CSS
// box model which is either a block-level or atomic inline-level element.
//   https://www.w3.org/TR/css3-transforms/#transformable-element
  abstract IsTransformable(): boolean

// Updates the source container box's cross references with its descendants in
// the box tree that have it as their containing block or stacking context.
// This function is called recursively.
  UpdateCrossReferencesOfContainerBox(
    source_box: ContainerBox,
    nearest_containing_block: RelationshipToBox,
    nearest_absolute_containing_block: RelationshipToBox,
    nearest_fixed_containing_block: RelationshipToBox,
    nearest_stacking_context: RelationshipToBox,
    stacking_context_container_box_stack: StackingContextContainerBoxStack) {
    let position_property = this.computed_style()!.position;
    let is_positioned = position_property != KeywordValue.GetStatic();

    let my_nearest_containing_block = nearest_containing_block;

    // Establish the containing block, as described in
    // http://www.w3.org/TR/CSS21/visudet.html#containing-block-details.
    // Containing blocks only matter for descendant positioned boxes.
    if (is_positioned) {
      if (position_property == KeywordValue.GetFixed()) {
        // If the element has 'position: fixed', the containing block is
        // established by the viewport in the case of continuous media or the page
        // area in the case of paged media.
        my_nearest_containing_block = nearest_fixed_containing_block;
      } else if (position_property == KeywordValue.GetAbsolute()) {
        // If the element has 'position: absolute', the containing block is
        // established by the nearest ancestor with a 'position' of 'absolute',
        // 'relative' or 'fixed'.
        my_nearest_containing_block = nearest_absolute_containing_block;
      }
      // Otherwise, the element's position is "relative"; the containing block is
      // formed by the content edge of the nearest block container ancestor box,
      // which is the initial value of |my_nearest_containing_block|.

      if (my_nearest_containing_block == RelationshipToBox.kIsBox) {
        source_box.AddContainingBlockChild(this);
      }
    }

    // Establish the stacking context, as described in
    // https://www.w3.org/TR/CSS21/visuren.html#z-index,
    // https://www.w3.org/TR/css3-color/#transparency, and
    // https://www.w3.org/TR/css3-transforms/#transform-rendering.
    // Stacking contexts only matter for descendant positioned boxes and child
    // stacking contexts.
    if (nearest_stacking_context == RelationshipToBox.kIsBox &&
      (is_positioned || this.IsStackingContext())) {
      // Fixed position elements cannot have a containing block that is not also
      // a stacking context, so it is impossible for it to have a containing
      // block that is closer than the stacking context, although it can be
      // further away.
      DCHECK(my_nearest_containing_block != RelationshipToBox.kIsBoxDescendant ||
        position_property != KeywordValue.GetFixed());

      // Default to using the stacking context itself as the nearest usable child
      // container. However, this may change if a usable container is found
      // further down in the container stack.
      let nearest_usable_child_container: ContainerBox = source_box;
      let containing_block_relationship_to_child_container: RelationshipToBox =
        my_nearest_containing_block;
      let overflow_hidden_to_apply: ContainingBlocksWithOverflowHidden = [];

      let z_index = this.GetZIndex();
      // If a fixed position box is encountered that has a z-index of 0, then
      // all of the containers within the current container stack are no longer
      // usable as child containers. The reason for this is that the fixed
      // position box is being added directly to the stacking context and will
      // resultantly be drawn after all of the boxes in the current container
      // stack. Given that subsequent boxes with a z-index of 0 should be drawn
      // after this fixed position box, using any boxes within the current
      // container stack will produce an incorrect draw order.
      if (position_property == KeywordValue.GetFixed() && z_index == 0) {
        for (let box of stacking_context_container_box_stack) {
          box.is_usable_as_child_container = false;
        }
      } else if (my_nearest_containing_block == RelationshipToBox.kIsBoxDescendant) {
        let passed_my_containing_block = false;
        let next_containing_block_requires_absolute_containing_block =
          position_property == KeywordValue.GetAbsolute();

        // Walk up the container box stack looking for two things:
        //   1. The nearest usable child container (meaning that it guarantees the
        //      proper draw order).
        //   2. All containing blocks with overflow hidden that are passed during
        //      the walk. Because the box is being added to a child container
        //      higher in the tree than these blocks, the box's nodes will not be
        //      descendants of those containing blocks in the render tree and the
        //      overflow hidden from them will need to be applied manually.
        for (let box of stacking_context_container_box_stack) {
          // Only check for a usable child container if the z_index is 0. If it
          // is not, then the stacking context must be used.
          if (z_index == 0 && box.is_usable_as_child_container) {
            DCHECK(box.is_absolute_containing_block);
            nearest_usable_child_container = box.container_box;
            containing_block_relationship_to_child_container =
              passed_my_containing_block ? RelationshipToBox.kIsBoxDescendant : RelationshipToBox.kIsBox;
            break;
          }

          // Check for the current container box being the next containing block
          // in the walk. If it is, then this box's containing block is guaranteed
          // to have been passed during the walk (since it'll be the first
          // containing block encountered); additionally, the ancestor containing
          // block can potentially apply overflow hidden to this box.
          if (box.is_absolute_containing_block ||
            !next_containing_block_requires_absolute_containing_block) {
            passed_my_containing_block = true;
            next_containing_block_requires_absolute_containing_block =
              box.has_absolute_position;
            if (box.has_overflow_hidden) {
              overflow_hidden_to_apply.push(box.container_box);
            }
          }
        }

        // Reverse the containing blocks with overflow hidden, so that they'll
        // start with the ones nearest to the child container.
        overflow_hidden_to_apply.reverse();
      }

      nearest_usable_child_container.AddStackingContextChild(
        this, z_index, containing_block_relationship_to_child_container,
        overflow_hidden_to_apply);
    }
  }

// Updates the horizontal margins for block level in-flow boxes. This is used
// for both non-replaced and replaced elements. See
// https://www.w3.org/TR/CSS21/visudet.html#blockwidth and
// https://www.w3.org/TR/CSS21/visudet.html#block-replaced-width.
  UpdateHorizontalMarginsAssumingBlockLevelInFlowBox(
    containing_block_direction: BaseDirection,
    containing_block_width: LayoutUnit,
    border_box_width: LayoutUnit,
    possibly_overconstrained_margin_left?: LayoutUnit,
    possibly_overconstrained_margin_right?: LayoutUnit) {
    let maybe_margin_left =
      possibly_overconstrained_margin_left;
    let maybe_margin_right =
      possibly_overconstrained_margin_right;

    // If "border-left-width" + "padding-left" + "width" + "padding-right" +
    // "border-right-width" (plus any of "margin-left" or "margin-right" that are
    // not "auto") is larger than the width of the containing block, then any
    // "auto" values for "margin-left" or "margin-right" are, for the following
    // rules, treated as zero.
    if ((maybe_margin_left || new LayoutUnit()).ADD(border_box_width).ADD((maybe_margin_right || new LayoutUnit()))
      .GT(containing_block_width)
    ) {
      maybe_margin_left = maybe_margin_left || new LayoutUnit();
      maybe_margin_right = maybe_margin_right || new LayoutUnit();
    }

    // If all of the above have a computed value other than "auto", the values
    // are said to be "over-constrained" and one of the used values will have to
    // be different from its computed value. If the "direction" property of the
    // containing block has the value "ltr", the specified value of "margin-right"
    // is ignored and the value is calculated so as to make the equality true. If
    // the value of "direction" is "rtl", this happens to "margin-left" instead.
    //
    // If there is exactly one value specified as "auto", its used value follows
    // from the equality.
    if (maybe_margin_left &&
      (!maybe_margin_right ||
        containing_block_direction == BaseDirection.kLeftToRightBaseDirection)) {
      this.set_margin_left(maybe_margin_left);
      this.set_margin_right(containing_block_width.SUB(maybe_margin_left).SUB(border_box_width));
    } else if (maybe_margin_right) {
      this.set_margin_left(containing_block_width.SUB(border_box_width).SUB(maybe_margin_right));
      this.set_margin_right(maybe_margin_right);
    } else {
      // If both "margin-left" and "margin-right" are "auto", their used values
      // are equal.
      let horizontal_margin = containing_block_width.SUB(border_box_width).DIV(2);
      this.set_margin_left(horizontal_margin);
      this.set_margin_right(horizontal_margin);
    }
  }

  // Set border insets in InlineContainerBox UpdateBorders to an empty
  // LayoutUnit or the computed_style value using is_split_on_*_.
  SetBorderInsets(left: LayoutUnit,
                  top: LayoutUnit,
                  right: LayoutUnit,
                  bottom: LayoutUnit) {
    this.border_insets_.SetInsets(left, top, right, bottom);
  }

  IsBorderStyleNoneOrHidden(border_style: PropertyValue) {
    if (border_style == KeywordValue.GetNone() || border_style == KeywordValue.GetHidden()) {
      return true;
    }
    return false;
  }

  ResetBorderInsets() {
    this.border_insets_ = new InsetsLayoutUnit();
  }

// Updates used values of "border" properties.
  UpdateBorders() {
    if (IsBorderStyleNoneOrHidden(this.computed_style()!.border_left_style) &&
      IsBorderStyleNoneOrHidden(this.computed_style()!.border_top_style) &&
      IsBorderStyleNoneOrHidden(this.computed_style()!.border_right_style) &&
      IsBorderStyleNoneOrHidden(this.computed_style()!.border_bottom_style)) {
      this.border_insets_ = new InsetsLayoutUnit();
      return;
    }

    this.border_insets_.SetInsets(GetUsedBorderLeft(this.computed_style()!),
      GetUsedBorderTop(this.computed_style()!),
      GetUsedBorderRight(this.computed_style()!),
      GetUsedBorderBottom(this.computed_style()!));
  }
// Updates used values of "padding" properties.
  UpdatePaddings(layout_params: LayoutParams) {
    this.padding_insets_.SetInsets(
      GetUsedPaddingLeft(this.computed_style()!, layout_params.containing_block_size!),
      GetUsedPaddingTop(this.computed_style()!, layout_params.containing_block_size!),
      GetUsedPaddingRight(this.computed_style()!, layout_params.containing_block_size!),
      GetUsedPaddingBottom(this.computed_style()!, layout_params.containing_block_size!));
  }

// Computes the normalized "outer" rounded corners (if there are any) from the
// border radii.
  ComputeRoundedCorners(): RoundedCorners | undefined {
    let border_radius_provider = new UsedBorderRadiusProvider(this.GetClampedBorderBoxSize().toSizeF());
    let border_top_left_radius = new RoundedCorner();
    let border_top_right_radius = new RoundedCorner();
    let border_bottom_right_radius = new RoundedCorner();
    let border_bottom_left_radius = new RoundedCorner();

    this.computed_style()!.border_top_left_radius.Accept(border_radius_provider);
    if (border_radius_provider.rounded_corner()) {
      border_top_left_radius = new RoundedCorner(
        border_radius_provider.rounded_corner()!.horizontal,
        border_radius_provider.rounded_corner()!.vertical);
    }

    this.computed_style()!.border_top_right_radius.Accept(border_radius_provider);
    if (border_radius_provider.rounded_corner()) {
      border_top_right_radius = new RoundedCorner(
        border_radius_provider.rounded_corner()!.horizontal,
        border_radius_provider.rounded_corner()!.vertical);
    }

    this.computed_style()!.border_bottom_right_radius.Accept(
      border_radius_provider);
    if (border_radius_provider.rounded_corner()) {
      border_bottom_right_radius = new RoundedCorner(
        border_radius_provider.rounded_corner()!.horizontal,
        border_radius_provider.rounded_corner()!.vertical);
    }
    this.computed_style()!.border_bottom_left_radius.Accept(
      border_radius_provider);
    if (border_radius_provider.rounded_corner()) {
      border_bottom_left_radius = new RoundedCorner(
        border_radius_provider.rounded_corner()!.horizontal,
        border_radius_provider.rounded_corner()!.vertical);
    }

    let rounded_corners: Optional<RoundedCorners> = undefined;
    if (!border_top_left_radius.IsSquare() ||
      !border_top_right_radius.IsSquare() ||
      !border_bottom_right_radius.IsSquare() ||
      !border_bottom_left_radius.IsSquare()) {
      rounded_corners = new RoundedCorners(border_top_left_radius, border_top_right_radius,
        border_bottom_right_radius,
        border_bottom_left_radius);
      rounded_corners =
        rounded_corners.Normalize(new RectF(this.GetClampedBorderBoxSize().toSizeF()));
    }

    return rounded_corners;
  }

  // Computes the corresponding "inner" rounded corners.
  ComputePaddingRoundedCorners(rounded_corners?: RoundedCorners): Optional<RoundedCorners> {
    let padding_rounded_corners_if_different: Optional<RoundedCorners> = undefined;

    if (rounded_corners && !this.border_insets_.zero()) {
      // If we have rounded corners and a non-zero border, then we need to
      // compute the "inner" rounded corners, as the ones specified by CSS apply
      // to the outer border edge.
      padding_rounded_corners_if_different = rounded_corners.Inset(new InsetsF(
        this.border_insets_.left().toFloat(), this.border_insets_.top().toFloat(),
        this.border_insets_.right().toFloat(), this.border_insets_.bottom().toFloat()));
    }

    let padding_rounded_corners: RoundedCorners | undefined =
      padding_rounded_corners_if_different
        ? padding_rounded_corners_if_different!
        : rounded_corners;

    if (padding_rounded_corners) {
      return padding_rounded_corners.Normalize(
        new RectF(this.GetClampedPaddingBoxSize().toSizeF()));
    } else {
      return padding_rounded_corners;
    }
  }

// Called after TryPlaceEllipsisOrProcessPlacedEllipsis() determines that the
// box is impacted by the ellipsis. This handles both determining the location
// of the ellipsis, if it has not already been placed, and updating the
// ellipsis-related state of the box, such as whether or not it should be
// fully or partially hidden.
  DoPlaceEllipsisOrProcessPlacedEllipsis(
    base_direction: BaseDirection,
    desired_offset: LayoutUnit,
    is_placement_requirement_met: boolean,
    is_placed: boolean,
    placed_offset: LayoutUnit
  ): { is_placement_requirement_met: boolean, is_placed: boolean, placed_offset: LayoutUnit } {
    throw new Error('umimplemented');
  }

// Get the rectangle for which gives the region that background-color
// and background-image would populate.
  GetBackgroundRect(): RectF {
    return new RectF(
      new PointF(this.border_left_width().toFloat(), this.border_top_width().toFloat()),
      this.GetClampedPaddingBoxSize().toSizeF());
  }

// Get the transform for this box from the specified containing block (which
// may be null to indicate root).
  GetMarginBoxTransformFromContainingBlockInternal(
    containing_block: ContainerBox, include_scroll: boolean): Matrix3F {
    let transform = Matrix3F.Identity();
    if (this == containing_block as Box) {
      return transform;
    }

    // Walk up the containing block tree to build the transform matrix.
    // The logic is similar to using ApplyTransformActionToCoordinate with exit
    // transform but a matrix is calculated instead; logic analogous to
    // GetMarginBoxOffsetFromRoot is also factored in.
    for (let box: Box = this; ;) {
      // Factor in the margin box offset.
      transform =
        TranslateMatrix(
          box.margin_box_offset_from_containing_block().x().toFloat(),
          box.margin_box_offset_from_containing_block().y().toFloat()).MUL(transform)
      ;

      // Factor in the box's transform.
      if (box.IsTransformed()) {
        let transform_rect_offset: Vector2dLayoutUnit =
          box.margin_box_offset_from_containing_block().ADD(box.GetBorderBoxOffsetFromMarginBox());
        transform =
          GetCSSTransform(box.computed_style()!.transform,
            box.computed_style()!.transform_origin,
            new RectF(transform_rect_offset.x().toFloat(),
              transform_rect_offset.y().toFloat(),
              box.GetBorderBoxWidth().toFloat(),
              box.GetBorderBoxHeight().toFloat())/*,
                          box.ComputeUiNavFocusForTransform()*/).MUL(transform);
      }

      const container = box.GetContainingBlock();
      if (container == containing_block || !container) {
        break;
      }

      // Convert the transform into the container's coordinate space.
      let containing_block_offset =
        box.GetContainingBlockOffsetFromItsContentBox(container).ADD(
          container.GetContentBoxOffsetFromMarginBox()
        );
      transform = TranslateMatrix(containing_block_offset.x().toFloat(),
        containing_block_offset.y().toFloat()).MUL(transform);

      // Factor in the container's scrollLeft / scrollTop as needed.
//    if (include_scroll && container.ui_nav_item_ &&
//        container.ui_nav_item_.IsContainer()) {
//      float left, top;
//      container.ui_nav_item_.GetContentOffset(&left, &top);
//      transform = math::TranslateMatrix(-left, -top) * transform;
//    }

      box = container;
    }

    return transform;
  }

// Some custom CSS transform functions require a UI navigation focus item as
// input. This computes the appropriate UI navigation item for this box's
// transform. This should only be called if the box IsTransformed().
//  scoped_refptr<ui_navigation::NavItem> ComputeUiNavFocusForTransform()

// Returns whether the overflow is animated by a UI navigation item.
//  bool IsOverflowAnimatedByUiNavigation() const {
//    return ui_nav_item_ && ui_nav_item_.IsContainer();
//  }

  // Helper methods used by |RenderAndAnimate|.
  RenderAndAnimateBorder(
    rounded_corners: RoundedCorners | undefined,
    border_node_builder: CompositionNodeBuilder/*,
      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder*/): void {
    //  bool has_animated_border = HasAnimatedBorder(animations());
    let has_animated_border = false;
    // If the border is absent or all borders are transparent, there is no need
    // to render border.
    if (this.border_insets_.zero() ||
      (!has_animated_border && AreAllBordersTransparent(this.computed_style()!))) {
      return;
    }

    let rect = new RectF(this.GetClampedBorderBoxSize().toSizeF());
    let rect_node_builder = new RectNodeBuilder(rect);
    SetupBorderNodeFromStyle(rounded_corners, this.computed_style()!, rect_node_builder);

    let border_node = new RectNode(rect_node_builder);
    border_node_builder.AddChild(border_node);

    //  if (has_animated_border) {
    //    AddAnimations<RectNode>(
    //        base::Bind(&PopulateBaseStyleForBorderNode),
    //        base::Bind(&SetupBorderNodeFromStyle, rounded_corners),
    //        *css_computed_style_declaration(), border_node, animate_node_builder);
    //  }
  }

  RenderAndAnimateOutline(border_node_builder: CompositionNodeBuilder/*,
      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder*/) {
    let rect = new RectF(this.GetClampedBorderBoxSize().toSizeF());
    let rect_node_builder = new RectNodeBuilder(rect);
//  bool has_animated_outline = HasAnimatedOutline(animations());
//  if (has_animated_outline) {
//    SetupOutlineNodeFromStyleWithOutset(rect, computed_style(),
//                                        &rect_node_builder, 0);
//  } else {
    SetupOutlineNodeFromStyle(rect, this.computed_style()!, rect_node_builder);
//  }

    let outline_node = new RectNode(rect_node_builder);

    border_node_builder.AddChild(outline_node);

//  if (has_animated_outline) {
//    AddAnimations<RectNode>(base::Bind(&PopulateBaseStyleForOutlineNode),
//                            base::Bind(&SetupOutlineNodeFromStyle, rect),
//                            *css_computed_style_declaration(), outline_node,
//                            animate_node_builder);
//  }
  }

  RenderAndAnimateBackgroundColor(
    rounded_corners: RoundedCorners | undefined,
    border_node_builder: CompositionNodeBuilder/*,
      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder*/) {

//  bool background_color_animated =
//      animations().IsPropertyAnimated(cssom::kBackgroundColorProperty);
    let background_color_animated = false;

    if (!this.blend_background_color_) {
      // Usually this code is executed only on the initial containing block box.
      DCHECK(!rounded_corners);
      DCHECK(!background_color_animated);

      border_node_builder.AddChild(
        new ClearRectNode(this.GetBackgroundRect(),
          GetUsedColor(this.computed_style()!.background_color)));
      return;
    }

    // Only create the RectNode if the background color is not the initial value
    // (which we know is transparent) and not transparent.  If it's animated,
    // add it no matter what since its value may change over time to be
    // non-transparent.
    let background_color_transparent =
      GetUsedColor(this.computed_style()!.background_color).a() == 0.0;
    if (!background_color_transparent || background_color_animated) {
      let rect_node_builder = new RectNodeBuilder(this.GetBackgroundRect());
      SetupBackgroundColorNodeFromStyle(rounded_corners, this.computed_style()!, rect_node_builder);
      if (!rect_node_builder.rect.IsEmpty()) {
        let rect_node = new RectNode(rect_node_builder);
        border_node_builder.AddChild(rect_node);

        // TODO: Investigate if we could pass css_computed_style_declaration_
        // instead here.
//      if (background_color_animated) {
//        AddAnimations<RectNode>(
//            base::Bind(&PopulateBaseStyleForBackgroundColorNode),
//            base::Bind(&SetupBackgroundColorNodeFromStyle, rounded_corners),
//            *css_computed_style_declaration(), rect_node, animate_node_builder);
//      }
      }
    }
  }

  RenderAndAnimateBackgroundImage(rounded_corners: RoundedCorners | undefined): RenderAndAnimateBackgroundImageResult {
    let result: RenderAndAnimateBackgroundImageResult = Object.create(null);
    // We track a single render tree node because most of the time there will only
    // be one.  If there is more, we set |single_node| to NULL and instead
    // populate |composition|.  The code here tries to avoid using CompositionNode
    // if possible to avoid constructing an std::vector.
    let single_node: Node | undefined = undefined;
    let composition: CompositionNodeBuilder | undefined = undefined;
    result.is_opaque = false;

    // let image_frame = this.GetBackgroundRect();
    //
    // let  property_list =
    //     this. computed_style()!.background_image as PropertyListValue
    //  // The farthest image is added to |composition_node_builder| first.
    //  for (let i=property_list.value().length-1;i>-1;i--) {
    //    // Skip this image if it is specified as none.
    //    let image_iterator  =property_list.value()[i]
    //    if (image_iterator == KeywordValue.GetNone()) {
    //      continue;
    //    }
    //
    //    let  background_node_provider = new UsedBackgroundNodeProvider(
    //      image_frame,
    //      this.computed_style()!.background_size,
    //      this.computed_style()!.background_position,
    //      this.computed_style()!.background_repeat,
    //      this.used_style_provider_);
    //    image_iterator.Accept(background_node_provider);
    //    let background_node =
    //      background_node_provider.background_node();
    //
    //    if (background_node) {
    //      if (rounded_corners) {
    //        // Apply rounded viewport filter to the background image.
    //        let  filter_node_builder = new FilterNodeBuilder(background_node);
    //        filter_node_builder.viewport_filter =
    //          new ViewportFilter(image_frame, rounded_corners);
    //        background_node = new FilterNode(filter_node_builder);
    //      }
    //
    //      // If any of the background image layers are opaque, we set that the
    //      // background image is opaque.  This is used to avoid setting up the
    //      // background color if the background image is just going to cover it
    //      // anyway.
    //      result.is_opaque |= background_node_provider.is_opaque();
    //
    //      // If this is not the first node to return, then our |single_node|
    //      // shortcut won't work, copy that single node into |composition| before
    //      // continuing.
    //      if (single_node) {
    //        composition!.emplace();
    //        composition!.AddChild(single_node);
    //        single_node = undefined
    //      }
    //      if (!composition) {
    //        single_node = background_node;
    //      } else {
    //        composition!.AddChild(background_node);
    //      }
    //    }
    //  }
    //
    //  if (single_node) {
    //    result.node = single_node;
    //  } else if (composition) {
    //    result.node = new CompositionNode(composition);
    //  }
    return result;
  }
  RenderAndAnimateBoxShadow(
    outer_rounded_corners: RoundedCorners | undefined,
    inner_rounded_corners: RoundedCorners | undefined,
    border_node_builder: CompositionNodeBuilder/*,
      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder*/) {
    if (this.computed_style()!.box_shadow != KeywordValue.GetNone()) {
      NOTIMPLEMENTED();
      // let box_shadow_list =
      //   this.computed_style()!.box_shadow as PropertyListValue;
      //
      // for (let i = 0; i < box_shadow_list.value().length; ++i) {
      //   // According to the spec, shadows are layered front to back, so we render
      //   // each shadow in reverse list order.
      //   //   https://www.w3.org/TR/2014/CR-css3-background-20140909/#shadow-layers
      //   let shadow_index = box_shadow_list.value().length - i - 1;
      //   let shadow_value =
      //     box_shadow_list.value()[shadow_index] as ShadowValue;
      //
      //   // Since most of a Gaussian fits within 3 standard deviations from the
      //   // mean, we setup here the Gaussian blur sigma to be a third of the blur
      //   // radius.
      //   let shadow_blur_sigma =
      //     shadow_value.blur_radius()
      //       ? GetUsedLength(shadow_value.blur_radius()).toFloat() / 3.0
      //       : 0;
      //
      //   // Setup the spread radius, defaulting it to 0 if it was never specified.
      //   let spread_radius =
      //     shadow_value.spread_radius()
      //       ? GetUsedLength(shadow_value.spread_radius()).toFloat()
      //       : 0;
      //
      //   // Setup our shadow parameters.
      //   let shadow = new Shadow(
      //     new Vector2dF(GetUsedLength(shadow_value.offset_x()).toFloat(),
      //       GetUsedLength(shadow_value.offset_y()).toFloat()),
      //     shadow_blur_sigma, GetUsedColor(shadow_value.color()));
      //
      //   let shadow_rect_size = shadow_value.has_inset()
      //     ? this.GetClampedPaddingBoxSize()
      //     : this.GetClampedBorderBoxSize();
      //
      //   // Inset nodes apply within the border, starting at the padding box.
      //   let rect_offset =
      //     shadow_value.has_inset()
      //       ? new PointF(this.border_left_width().toFloat(),
      //       this.border_top_width().toFloat())
      //       : new PointF();
      //
      //   let shadow_builder = new RectShadowNodeBuilder(
      //     new RectF(rect_offset, shadow_rect_size.toSizeF()), shadow,
      //     shadow_value.has_inset(), spread_radius);
      //
      //   if (outer_rounded_corners) {
      //     if (shadow_value.has_inset()) {
      //       shadow_builder.rounded_corners = inner_rounded_corners;
      //     } else {
      //       shadow_builder.rounded_corners = outer_rounded_corners;
      //     }
      //   }
      //
      //   // Finally, create our shadow node.
      //   let shadow_node =
      //     new RectShadowNode(shadow_builder);
      //
      //   border_node_builder.AddChild(shadow_node);
    }
  }

// If opacity is animated or other than 1, wraps a border node into a filter
// node. Otherwise returns the original border node.
  RenderAndAnimateOpacity(
    border_node: Node,
    //      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder,
    opacity: number, opacity_animated: boolean): Node {
    if (opacity < 1.0 || opacity_animated) {
      NOTIMPLEMENTED;
//       let filter_node_builder = new FilterNodeBuilder(border_node);
//
//       if (opacity < 1.0) {
//         filter_node_builder.opacity_filter.push(Math.max(0.0, opacity));
//       }
//
//       let filter_node = new FilterNode(filter_node_builder);
//
// //    if (opacity_animated) {
// //      // Possibly setup an animation for opacity.
// //      AddAnimations<FilterNode>(base::Bind(&PopulateBaseStyleForFilterNode),
// //                                base::Bind(&SetupFilterNodeFromStyle),
// //                                *css_computed_style_declaration(), filter_node,
// //                                animate_node_builder);
// //    }
//       return filter_node;
    }

    return border_node;
  }

  RenderAndAnimateOverflow(
    rounded_corners: RoundedCorners | undefined,
    content_node: Node,
    //      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder,
    border_offset: Vector2dF): { overflow_node: Node, rounded_corners: Optional<RoundedCorners> } {
    rounded_corners =
      this.ComputeRoundedCorners();

    let padding_rounded_corners =
      this.ComputePaddingRoundedCorners(rounded_corners);

//  AnimateNode::Builder animate_node_builder;
    let { overflow_node, rounded_corners: rounded_corners_result } =
      this.RenderAndAnimateOverflow(padding_rounded_corners, content_node,
        /*&animate_node_builder, */border_offset);
    rounded_corners = rounded_corners_result;
//  if (animate_node_builder.empty()) {
    return {
      overflow_node,
      rounded_corners
    };
//  }
//  return new AnimateNode(animate_node_builder, overflow_node);
  }

// If transform is not "none", wraps a border node in a MatrixTransformNode.
// If transform is "none", returns the original border node and leaves
// |border_node_transform| intact.
  RenderAndAnimateTransform(
    border_node: Node,
    //      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder,
    border_node_offset: Vector2dF): Node {
    // Certain transforms need a UI navigation focus item as input.
//  scoped_refptr<ui_navigation::NavItem> ui_nav_focus;

    // Some transform functions change over time, so they will need to be
    // evaluated indefinitely.
    let transform_is_dynamic = false;

    {
      let property_value =
        this.computed_style()!.transform;
      if (property_value != KeywordValue.GetNone()) {
//      ui_nav_focus = ComputeUiNavFocusForTransform();
        let transform_value =
          property_value as TransformPropertyValue;
        transform_is_dynamic =
          transform_value.HasTrait(Trait.kTraitIsDynamic);
      }
    }

    let used_rect = new RectF(PointAtOffsetFromOrigin(border_node_offset),
      this.GetClampedBorderBoxSize().toSizeF()!);

//  if (IsTransformable() &&
//      animations().IsPropertyAnimated(cssom::kTransformProperty)) {
//    // If the CSS transform is animated, we cannot flatten it into the layout
//    // transform, thus we create a new matrix transform node to separate it and
//    // animate that node only.
//    scoped_refptr<MatrixTransformNode> css_transform_node =
//        new MatrixTransformNode(border_node, math::Matrix3F::Identity());
//
//    // Specifically animate only the matrix transform node with the CSS
//    // transform.
//    // Do AddAnimations<MatrixTransformNode> with a custom end time.
//    scoped_refptr<cssom::MutableCSSComputedStyleData> base_style =
//        new cssom::MutableCSSComputedStyleData();
//    base_style.set_transform(computed_style().transform());
//    base_style.set_transform_origin(computed_style().transform_origin());
////    web_animations::BakedAnimationSet baked_animation_set(
////        *css_computed_style_declaration().animations());
////    animate_node_builder.Add(
////        css_transform_node,
////        base::Bind(&ApplyAnimation<MatrixTransformNode>,
////                   base::Bind(&SetupMatrixTransformNodeFromCSSStyle, used_rect,
////                              ui_nav_focus),
////                   baked_animation_set, base_style),
////        transform_is_dynamic ? base::TimeDelta::Max()
////                             : baked_animation_set.end_time());
//
//    return css_transform_node;
//  }

    if (transform_is_dynamic) {
      // The CSS transform uses function(s) whose value changes over time. Animate
      // the matrix transform node indefinitely.
      let css_transform_node =
        new MatrixTransformNode(border_node, Matrix3F.Identity());
//    animate_node_builder.Add(
//        css_transform_node,
//        base::Bind(&SetupMatrixTransformNodeFromCSSTransform, used_rect,
//                   ui_nav_focus, computed_style().transform(),
//                   computed_style().transform_origin()));
      return css_transform_node;
    }

    if (this.IsTransformed()) {
      let matrix = GetCSSTransform(
        this.computed_style()!.transform,
        this.computed_style()!.transform_origin, used_rect/*, ui_nav_focus*/);
      if (matrix.IsIdentity()) {
        return border_node;
      } else {
        // Combine layout transform and CSS transform.
        return new MatrixTransformNode(border_node, matrix);
      }
    }

    return border_node;
  }

// This adds an animation to reflect content scrolling by the UI navigation
// system. Call this only if IsOverflowAnimatedByUiNavigation().
//  scoped_refptr<render_tree::Node> RenderAndAnimateUiNavigationContainer(
//      const scoped_refptr<render_tree::Node>& node_to_animate,
//      render_tree::animations::AnimateNode::CompositionNodeBuilder* animate_node_builder);

  generating_html_: string = '';
  node: Optional<DOMNode>;
  SetGeneratingNode(generating_node: DOMNode) {
    this.node = generating_node;
    generating_node.SetLayoutObject(new LayoutObject(generating_node, this));
    let html_serializer = new Serializer();
    html_serializer.SerializeSelfOnly(generating_node);
    this.generating_html_ = html_serializer.toString();
  }

  DumpWithIndent(str = '', indent: number = 2): string {
    if (this.generating_html_.length) {
      str = this.DumpIndent(str, indent);
      str += '# ';
      str += this.generating_html_;
      str += '\n';
    }

    str = this.DumpIndent(str, indent);
    str = this.DumpClassName(str);
    str = this.DumpProperties(str);
    str += '\n';

    return this.DumpChildrenWithIndent(str, indent + 2);
  }

  protected DumpIndent(str: string, indent: number): string {
    while (indent--) {
      str += ' ';
    }
    return str;
  }

  abstract DumpClassName(stream: string): string
  // Overriders must call the base method.
  DumpProperties(stream: string): string {
    stream += 'left=';
    stream += this.left();
    stream += ' ';
    stream += 'top=';
    stream += this.top();
    stream += ' ';
    stream += 'width=';
    stream += this.width();
    stream += ' ';
    stream += 'height=';
    stream += this.height();
    stream += ' ';

    stream += 'margin=';
    stream += this.margin_insets_.toString();
    stream += ' ';
    stream += 'border_width=';
    stream += this.border_insets_.toString();
    stream += ' ';
    stream += 'padding=';
    stream += this.padding_insets_.toString();
    stream += ' ';

    stream += 'baseline=';
    stream += this.GetBaselineOffsetFromTopMarginEdge();
    stream += ' ';
    if (this.css_computed_style_declaration_ &&
      this.css_computed_style_declaration_.data()) {
      stream += 'is_inline_before_blockification=';
      stream += this.is_inline_before_blockification();
      stream += ' ';
    }
    return stream;
  }
  // Overriders must call the base method.
  DumpChildrenWithIndent(stream: string, indent: number): string {
    return stream;
  }

  // Build an array of quads in absolute coords for line boxes
  abstract AbsoluteQuads(quads: QuadF[], mode: Optional<MapCoordinatesFlags>): void
  protected LocalRectToAbsoluteQuad(rect: RectLayoutUnit,
                                    mode: MapCoordinatesFlags): QuadF {
    return this.LocalRectToAncestorQuad(rect, undefined, mode);
  }
  LocalRectToAncestorQuad(rect: RectLayoutUnit,
                          ancestor: Optional<ContainerBox>,
                          mode: MapCoordinatesFlags): QuadF {
    return this.LocalToAncestorQuad(QuadF.fromRectF(RectF.fromRectLayoutUnit(rect)), ancestor, mode);
  }
  LocalToAncestorQuad(
    local_quad: QuadF,
    ancestor: Optional<ContainerBox>,
    mode: MapCoordinatesFlags): QuadF {
    NOTIMPLEMENTED();
    // Track the point at the center of the quad's bounding box. As
    // MapLocalToAncestor() calls OffsetFromContainer(), it will use that point
    // as the reference point to decide which column's transform to apply in
    // multiple-column blocks.

    // TransformState transform_state(TransformState::kApplyTransformDirection,
    // local_quad.BoundingBox().CenterPoint(),
    // local_quad);
    // MapLocalToAncestor(ancestor, transform_state, mode);
    // transform_state.Flatten();
    //
    // return transform_state.LastPlanarQuad();
  }
}

function IsBorderStyleNoneOrHidden(border_style: PropertyValue): boolean {
  if (border_style == KeywordValue.GetNone() ||
    border_style == KeywordValue.GetHidden()) {
    return true;
  }
  return false;
}

function GetTransformedBox(transform: Matrix3F,
                           box: RectLayoutUnit): RectLayoutUnit {
  let kNumPoints = 4;
  let box_corners: PointF[] = [
    new PointF(box.x().toFloat(), box.y().toFloat()),
    new PointF(box.right().toFloat(), box.y().toFloat()),
    new PointF(box.x().toFloat(), box.bottom().toFloat()),
    new PointF(box.right().toFloat(), box.bottom().toFloat()),
  ];

  for (let i = 0; i < kNumPoints; ++i) {
    box_corners[i] = transform.MUL(box_corners[i]);
  }

  // Return the bounding box for the transformed points.
  let min_corner = box_corners[0];
  let max_corner = box_corners[0];
  for (let i = 1; i < kNumPoints; ++i) {
    min_corner.SetToMin(box_corners[i]);
    max_corner.SetToMax(box_corners[i]);
  }

  return new RectLayoutUnit(new LayoutUnit(min_corner.x()), new LayoutUnit(min_corner.y()),
    new LayoutUnit(max_corner.x() - min_corner.x()),
    new LayoutUnit(max_corner.y() - min_corner.y()));
}

// Returns a matrix representing the transform on the object induced by its
// CSS transform style property.  If the object does not have a transform
// style property set, this will be the identity matrix.  Otherwise, it is
// calculated from the property value and returned.  The transform-origin
// style property will also be taken into account, and therefore the laid
// out size of the object is also required in order to resolve a
// percentage-based transform-origin.
function GetCSSTransform(
  transform_property_value: PropertyValue,
  transform_origin_property_value: PropertyValue,
  used_rect: RectF/*,
    const scoped_refptr<ui_navigation::NavItem>& ui_nav_focus*/): Matrix3F {
  if (transform_property_value == KeywordValue.GetNone()) {
    return Matrix3F.Identity();
  }

  let transform_value = transform_property_value as TransformPropertyValue;
  let css_transform_matrix: Matrix3F =
    transform_value.ToMatrix(used_rect.size()/*, ui_nav_focus*/);

  // Apply the CSS transformations, taking into account the CSS
  // transform-origin property.
  let origin = GetTransformOrigin(used_rect, transform_origin_property_value);

  return TranslateMatrix(origin.x(), origin.y()).MUL(css_transform_matrix).MUL(TranslateMatrix(-origin.x(), -origin.y()));
}

function AreAllBordersTransparent(style: ComputedStyleData): boolean {
  return (GetUsedColor(style.border_left_color).a() == 0.0) &&
    (GetUsedColor(style.border_right_color).a() == 0.0) &&
    (GetUsedColor(style.border_top_color).a() == 0.0) &&
    (GetUsedColor(style.border_bottom_color).a() == 0.0);
}

function SetupBorderNodeFromStyle(
  rounded_corners: Optional<RoundedCorners>,
  style: ComputedStyleData,
  rect_node_builder: RectNodeBuilder) {
  rect_node_builder.border = CreateBorderFromStyle(style);

  if (rounded_corners) {
    rect_node_builder.rounded_corners = new RoundedCorners(rounded_corners);
  }
}

function SetupOutlineNodeFromStyle(
  rect: RectF,
  style: ComputedStyleData,
  rect_node_builder: RectNodeBuilder) {
  SetupOutlineNodeFromStyleWithOutset(
    rect, style, rect_node_builder,
    GetUsedNonNegativeLength(style.outline_width).toFloat());
}

function SetupBackgroundColorNodeFromStyle(
  rounded_corners: Optional<RoundedCorners>,
  style: ComputedStyleData,
  rect_node_builder: RectNodeBuilder) {
  rect_node_builder.background_brush =
    new SolidColorBrush(
      GetUsedColor(style.background_color));

  if (rounded_corners) {
    rect_node_builder.rounded_corners = new RoundedCorners(rounded_corners);
  }
}

function CreateBorderFromStyle(style: ComputedStyleData): Border {
  let left = new BorderSide(
    GetUsedNonNegativeLength(style.border_left_width).toFloat(),
    GetRenderTreeBorderStyle(style.border_left_style),
    GetUsedColor(style.border_left_color));

  let right = new BorderSide(
    GetUsedNonNegativeLength(style.border_right_width).toFloat(),
    GetRenderTreeBorderStyle(style.border_right_style),
    GetUsedColor(style.border_right_color));

  let top = new BorderSide(
    GetUsedNonNegativeLength(style.border_top_width).toFloat(),
    GetRenderTreeBorderStyle(style.border_top_style),
    GetUsedColor(style.border_top_color));

  let bottom = new BorderSide(
    GetUsedNonNegativeLength(style.border_bottom_width).toFloat(),
    GetRenderTreeBorderStyle(style.border_bottom_style),
    GetUsedColor(style.border_bottom_color));

  return new Border(left, right, top, bottom);
}

function GetRenderTreeBorderStyle(border_style: PropertyValue): BorderStyle {
  let render_tree_border_style = BorderStyle.kBorderStyleNone;
  if (!IsBorderStyleNoneOrHidden(border_style)) {
    DCHECK_EQ(border_style, KeywordValue.GetSolid());
    render_tree_border_style = BorderStyle.kBorderStyleSolid;
  }

  return render_tree_border_style;
}

function SetupOutlineNodeFromStyleWithOutset(
  rect: RectF,
  style: ComputedStyleData,
  rect_node_builder: RectNodeBuilder, outset_width: number) {
  rect_node_builder.rect = rect;
  rect_node_builder.rect.Outset(outset_width, outset_width);
  if (outset_width != 0) {
    rect_node_builder.border = new Border(new BorderSide(
      outset_width, GetRenderTreeBorderStyle(style.outline_style),
      GetUsedColor(style.outline_color)));
  }
}
