// The class represents a Replaced element in the layout tree. It is used to
// render elements like embed, iframe or video. Currently it renders the element
// as an image retrieved from a callback passed into its ctor.
//   https://www.w3.org/TR/html50/rendering.html#replaced-elements
//
// TODO: Make ReplacedBox support elements other than media element.
import { Box, LayoutParams } from './box';
import { Callback } from '@neditor/core/base/callback';
import { Image } from '../render_tree/image';
import { GetBreakPolicyFromWrapOpportunityPolicy, Paragraph } from './paragraph';
import { LayoutUnit } from './layout_unit';
import {
  GetUsedHeightIfNotAuto,
  GetUsedLeftIfNotAuto,
  GetUsedMarginBottomIfNotAuto,
  GetUsedMarginLeftIfNotAuto,
  GetUsedMarginRightIfNotAuto,
  GetUsedMarginTopIfNotAuto,
  GetUsedMaxHeightIfNotNone,
  GetUsedMaxWidthIfNotNone,
  GetUsedMinHeightIfNotAuto,
  GetUsedMinWidthIfNotAuto,
  GetUsedTopIfNotAuto,
  GetUsedWidthIfNotAuto,
  UsedStyleProvider
} from './used_style';
import { SizeF } from '../math/size_f';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { ShouldProcessWrapOpportunityPolicy, WrapAtPolicy, WrapOpportunityPolicy, WrapResult } from './line_wrapping';
import { Optional } from '@neditor/core/base/common/typescript';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { CompositionNode, CompositionNodeBuilder } from '../render_tree/composition_node';
import { ContainerBox } from './container_box';
import { BaseDirection } from './base_direction';
import { DCHECK } from '@neditor/core/base/check';
import { KeywordValue } from '../cssom/keyword_value';
import { DoesAllowTextWrapping } from './white_space_processing';
import { ERROR, LOG } from '@neditor/core/base/logging';
import { isNil } from '@neditor/core/base/common/type';
import { RectNode } from '../render_tree/rect_node';
import { RectF } from '../math/rect_f';
import { SolidColorBrush } from '../render_tree/brush';
import { ColorRGBA } from '../render_tree/color_rgba';
import { GetLetterboxDimensions, LetterboxDimensions } from './letterboxed_image';
import { ImageNode, ImageNodeBuilder } from '../render_tree/image_node';
import { SizeLayoutUnit } from './size_layout_unit';
import { QuadF } from '../math/quad_f';
import { MapCoordinatesFlags } from './map_coordinates_flags';
import { Path } from "../render_tree/path";
import { FreehandNode } from "../render_tree/freehand_node";
import { IReference } from "../../base/common/lifecycle";

export type ReplaceImageCB = Callback<Image>;

// typedef render_tree::PunchThroughVideoNode::SetBoundsCB SetBoundsCB;

// Used when intrinsic ratio cannot be determined,
// as per https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width.
const kFallbackIntrinsicRatio = 2.0;

// Becomes a used value of "width" if it cannot be determined by any other
// means, as per https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width.
const kFallbackWidth = 300.0;

export enum ReplacedBoxMode {
  kImage = 1,
  kVideo,
  kPunchOutVideo,
  kLottie,
  kFreehand
};

export abstract class ReplacedBox<T> extends Box {
  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    content: T,
    paragraph_ref: IReference<Paragraph>,
    text_position: number,
    maybe_intrinsic_width: Optional<LayoutUnit>,
    maybe_intrinsic_height: Optional<LayoutUnit>,
    maybe_intrinsic_ratio: Optional<number>,
    used_style_provider: UsedStyleProvider,
    replaced_box_mode: Optional<ReplacedBoxMode>,
    content_size: SizeF,
    // base::Optional<render_tree::LottieAnimation::LottieProperties> lottie_properties,
    //  layout_stat_tracker: LayoutStatTracker
  ) {
    super(css_computed_style_declaration, used_style_provider);
    this.maybe_intrinsic_width_ = maybe_intrinsic_width;
    this.maybe_intrinsic_height_ = maybe_intrinsic_height;
    // Like Chromium we assume that an element must always have an intrinsic
    // ratio although technically it's a spec violation. For details see
    // https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width.
    this.intrinsic_ratio_ = maybe_intrinsic_ratio || kFallbackIntrinsicRatio;
    this.content_ = content;
    // this. set_bounds_cb_ = set_bounds_cb
    this._register(this.paragraph_ref_ = paragraph_ref);
    this.text_position_ = text_position;
    this.replaced_box_mode_ = replaced_box_mode;
    this.content_size_ = new SizeLayoutUnit(content_size);
  }

  // From |Box|.
  TryWrapAt(
    wrap_at_policy: WrapAtPolicy,
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean): WrapResult {
// NOTE: This logic must stay in sync with
    // InlineLevelBlockContainerBox::TryWrapAt().
    DCHECK(!this.IsAbsolutelyPositioned());

    // Wrapping is not allowed until the line's existence is justified, meaning
    // that wrapping cannot occur before the box. Given that this box cannot be
    // split, no wrappable point is available.
    if (!is_line_existence_justified) {
      return WrapResult.kWrapResultNoWrap;
    }

    // Atomic inline elements participate in the inline formatting context as a
    // single opaque box. Therefore, the parent's style should be used, as the
    // internals of the atomic inline element have no impact on the formatting of
    // the line.
    // https://www.w3.org/TR/CSS21/visuren.html#inline-boxes
    if (!this.parent()) {
      return WrapResult.kWrapResultNoWrap;
    }

    let style_allows_break_word = this.parent()!.computed_style()!.overflow_wrap ==
      KeywordValue.GetBreakWord();

    if (!ShouldProcessWrapOpportunityPolicy(wrap_opportunity_policy,
      style_allows_break_word)) {
      return WrapResult.kWrapResultNoWrap;
    }

    // Even when the style prevents wrapping, wrapping can still occur before the
    // box if the line's existence has already been justified and whitespace
    // precedes it.
    if (!DoesAllowTextWrapping(this.parent()!.computed_style()!.white_space)) {
      if (this.text_position_ > 0 &&
        this.paragraph_ref_.object.IsCollapsibleWhiteSpace(this.text_position_ - 1)) {
        return WrapResult.kWrapResultWrapBefore;
      } else {
        return WrapResult.kWrapResultNoWrap;
      }
    }

    let break_policy =
      GetBreakPolicyFromWrapOpportunityPolicy(
        wrap_opportunity_policy, style_allows_break_word);
    return this.paragraph_ref_.object.IsBreakPosition(this.text_position_, break_policy)
      ? WrapResult.kWrapResultWrapBefore
      : WrapResult.kWrapResultNoWrap;
  }

  SplitBidiLevelRuns() {
  }
  TrySplitAtSecondBidiLevelRun(): boolean {
    return false;
  }
  GetBidiLevel(): Optional<number> {
    return this.paragraph_ref_.object.GetBidiLevel(this.text_position_);
  }

  SetShouldCollapseLeadingWhiteSpace(
    should_collapse_leading_white_space: boolean) {
    // Do nothing.
  }
  SetShouldCollapseTrailingWhiteSpace(
    should_collapse_trailing_white_space: boolean) {
  }
  HasLeadingWhiteSpace(): boolean {
    return false;
  }
  HasTrailingWhiteSpace(): boolean {
    return false;
  }
  IsCollapsed(): boolean {
    return false;
  }

  JustifiesLineExistence(): boolean {
    return true;
  }
  AffectsBaselineInBlockFormattingContext(): boolean {
    return false;
  }
  GetBaselineOffsetFromTopMarginEdge(): LayoutUnit {
    return this.GetMarginBoxHeight();
  }

  // From |Box|.
  UpdateContentSizeAndMargins(layout_params: LayoutParams) {
    let maybe_width = GetUsedWidthIfNotAuto(this.computed_style()!, layout_params.containing_block_size);
    let maybe_height = GetUsedHeightIfNotAuto(this.computed_style()!, layout_params.containing_block_size);

    if (layout_params.freeze_width) {
      maybe_width = this.width();
    }
    if (layout_params.freeze_height) {
      maybe_height = this.height();
    }

    let maybe_left = GetUsedLeftIfNotAuto(
      this.computed_style(), layout_params.containing_block_size);
    let maybe_top = GetUsedTopIfNotAuto(
      this.computed_style(), layout_params.containing_block_size);

    if (this.IsAbsolutelyPositioned()) {
      // TODO: Implement CSS section 10.3.8, see
      // https://www.w3.org/TR/CSS21/visudet.html#abs-replaced-width.
      this.set_left(maybe_left || new LayoutUnit(this.GetStaticPositionLeft()));
      this.set_top(maybe_top || new LayoutUnit(this.GetStaticPositionTop()));
    }
    // Note that computed height may be "auto", even if it is specified as a
    // percentage (depending on conditions of the containing block). See details
    // in the spec. https://www.w3.org/TR/CSS22/visudet.html#the-height-property
    if (!maybe_height) {
      LOG(ERROR, 'ReplacedBox element has computed height "auto"!');
    }
    if (!maybe_width) {
      LOG(ERROR, 'ReplacedBox element has computed width "auto"!');
    }
    // In order for Cobalt to handle "auto" dimensions correctly for both punchout
    // and decode-to-texture we need to use the content's intrinsic dimensions &
    // ratio rather than using the content_box_size directly. Until this
    // functionality is found to be useful, we avoid the extra complexity
    // introduced by its implementation.
    if (!maybe_height || !maybe_width) {
      LOG(ERROR,
        'Cobalt ReplacedBox does not handle "auto" dimensions correctly! ',
        '"auto" dimensions are updated using the intrinsic dimensions of ',
        'the content (e.g. video width/height), which is often not what is ',
        'intended.'
      );
    }
    if (!maybe_width) {
      if (!maybe_height) {
        if (this.maybe_intrinsic_width_) {
          // If "height" and "width" both have computed values of "auto" and
          // the element also has an intrinsic width, then that intrinsic width
          // is the used value of "width".
          //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width
          this.set_width(this.maybe_intrinsic_width_);
        } else if (this.maybe_intrinsic_height_) {
          // If "height" and "width" both have computed values of "auto" and
          // the element has no intrinsic width, but does have an intrinsic height
          // and intrinsic ratio then the used value of "width" is:
          //     (intrinsic height) * (intrinsic ratio)
          //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width
          this.set_width(this.maybe_intrinsic_height_.MUL(this.intrinsic_ratio_));
        } else {
          // Otherwise, if "width" has a computed value of "auto", but none of
          // the conditions above are met, then the used value of "width" becomes
          // 300px.
          //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width
          this.set_width(new LayoutUnit(kFallbackWidth));
        }
      } else {
        // If "width" has a computed value of "auto", "height" has some other
        // computed value, and the element does have an intrinsic ratio then
        // the used value of "width" is:
        //     (used height) * (intrinsic ratio)
        //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width
        this.set_width(maybe_height.MUL(this.intrinsic_ratio_));
      }
    } else {
      this.set_width(maybe_width);
    }

    if (!maybe_height) {
      if (!maybe_width && this.maybe_intrinsic_height_) {
        // If "height" and "width" both have computed values of "auto" and
        // the element also has an intrinsic height, then that intrinsic height
        // is the used value of "height".
        //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-height
        this.set_height(this.maybe_intrinsic_height_);
      } else {
        // Otherwise, if "height" has a computed value of "auto", and the element
        // has an intrinsic ratio then the used value of "height" is:
        //     (used width) / (intrinsic ratio)
        //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-height
        this.set_height(this.width().DIV(this.intrinsic_ratio_));
      }
    } else {
      this.set_height(maybe_height);
    }

    if (!maybe_width && !maybe_height) {
      // For replaced elements with an intrinsic ratio and both 'width' and
      // 'height' specified as 'auto', the algorithm is as described in
      // https://www.w3.org/TR/CSS21/visudet.html#min-max-widths.

      let maybe_max_width = GetUsedMaxWidthIfNotNone(this.computed_style(), layout_params.containing_block_size);
      let min_width = GetUsedMinWidthIfNotAuto(this.computed_style(), layout_params.containing_block_size,);
      if (!min_width) min_width = new LayoutUnit();
      let maybe_max_height = GetUsedMaxHeightIfNotNone(
        this.computed_style(), layout_params.containing_block_size);
      let min_height =
        GetUsedMinHeightIfNotAuto(this.computed_style(),
          layout_params.containing_block_size)
        || (new LayoutUnit());

      // The values w and h stand for the results of the width and height
      // computations ignoring the 'min-width', 'min-height', 'max-width' and
      // 'max-height' properties. Normally these are the intrinsic width and
      // height, but they may not be in the case of replaced elements with
      // intrinsic ratios.
      //   https://www.w3.org/TR/CSS21/visudet.html#min-max-widths
      let w = this.width();
      let h = this.height();

      // Take the max-width and max-height as max(min, max) so that min <= max
      // holds true.
      //   https://www.w3.org/TR/CSS21/visudet.html#min-max-widths
      let max_height: Optional<LayoutUnit>;
      let h_greater_than_max_height = false;
      if (maybe_max_height) {
        max_height = LayoutUnit.Max(min_height, maybe_max_height);
        h_greater_than_max_height = h.GT(max_height);
      }

      let max_width: Optional<LayoutUnit>;
      let w_greater_than_max_width = false;
      if (maybe_max_width) {
        max_width = LayoutUnit.Max(min_width, maybe_max_width);
        w_greater_than_max_width = w.GT(max_width);
      }

      // This block sets resolved width and resolved height values according to
      // the table listing a number of different constraint violations in
      // https://www.w3.org/TR/CSS21/visudet.html#min-max-widths.
      if (w_greater_than_max_width) {
        if (h_greater_than_max_height) {
          let max_width_ratio = max_width!.DIV(w.toFloat());
          let max_height_ratio = max_height!.DIV(h.toFloat());
          if (max_width_ratio > max_height_ratio) {
            // Constraint: (w > max-width) and (h > max-height), where
            // (max-width/w > max-height/h)
            this.set_width(
              LayoutUnit.Max(min_width, max_height!.MUL(w.toFloat() / h.toFloat())));
            this.set_height(max_height!);
          } else {
            // Constraint: (w > max-width) and (h > max-height), where
            // (max-width/w <= max-height/h)
            this.set_width(max_width!);
            this.set_height(
              LayoutUnit.Max(min_height, max_width!.MUL(h.toFloat() / w.toFloat())));
          }
        } else {  // not h_greater_than_max_height
          if (h < min_height) {
            // Constraint: (w > max-width) and (h < min-height)
            this.set_width(max_width!);
            this.set_height(min_height);
          } else {  // not h < min_height
            // Constraint: w > max-width
            this.set_width(max_width!);
            this.set_height(
              LayoutUnit.Max(max_width !.MUL(h.toFloat() / w.toFloat()), min_height));
          }
        }
      } else {  // not w_greater_than_max_width
        if (w < min_width) {
          if (h_greater_than_max_height) {
            // Constraint: (w < min-width) and (h > max-height)
            this.set_width(min_width);
            this.set_height(max_height!);
          } else {  // not h_greater_than_max_height
            if (h < min_height) {
              let min_width_ratio = min_width!.DIV(w.toFloat());
              let min_height_ratio = min_height!.DIV(h.toFloat());
              if (min_width_ratio > min_height_ratio) {
                // Constraint: (w < min-width) and (h < min-height), where
                // (min-width/w > min-height/h)
                this.set_width(min_width);
                let height = min_width.MUL(h.toFloat() / w.toFloat());
                if (max_height) {
                  this.set_height(LayoutUnit.Min(max_height, height));
                } else {
                  this.set_height(height);
                }
              } else {
                // Constraint: (w < min-width) and (h < min-height), where
                // (min-width/w <= min-height/h)
                let width = min_height.MUL(w.toFloat() / h.toFloat());
                if (max_width) {
                  this.set_width(LayoutUnit.Min(max_width, width));
                } else {
                  this.set_width(width);
                }
                this.set_height(min_height);
              }
            } else {  // not h < min-height
              // Constraint: w < min-width
              this.set_width(min_width);
              let height = min_width.MUL(h.toFloat() / w.toFloat());
              if (max_height) {
                this.set_height(LayoutUnit.Min(height, max_height));
              } else {
                this.set_height(height);
              }
            }
          }
        } else {  // not w < min_width
          if (h_greater_than_max_height) {
            // Constraint: h > max-height
            this.set_width(
              LayoutUnit.Max(max_height !.MUL(w.toFloat() / h.toFloat()), min_width));
            this.set_height(max_height!);
          } else {  // not h_greater_than_max_height
            if (h < min_height) {
              // Constraint: h < min-height
              let width = min_height.MUL(w.toFloat() / h.toFloat());
              if (max_width) {
                this.set_width(LayoutUnit.Min(width, max_width));
              } else {
                this.set_width(width);
              }
              this.set_height(min_height);
            } else {  // not h < min_height
              // Constraint: none
              // Do nothing (keep w and h).
            }
          }
        }
      }
    }

    // The horizontal margin rules are difference for block level replaced boxes
    // versus inline level replaced boxes.
    //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width
    //   https://www.w3.org/TR/CSS21/visudet.html#block-replaced-width
    let maybe_margin_left = GetUsedMarginLeftIfNotAuto(
      this.computed_style(), layout_params.containing_block_size);
    let maybe_margin_right = GetUsedMarginRightIfNotAuto(
      this.computed_style(), layout_params.containing_block_size);
    let border_box_width = this.GetBorderBoxWidth();
    this.UpdateHorizontalMargins(layout_params.containing_block_direction,
      layout_params.containing_block_size.width(),
      border_box_width, maybe_margin_left,
      maybe_margin_right);

    let maybe_margin_top = GetUsedMarginTopIfNotAuto(
      this.computed_style(), layout_params.containing_block_size);
    let maybe_margin_bottom = GetUsedMarginBottomIfNotAuto(
      this.computed_style(), layout_params.containing_block_size);

    // If "margin-top", or "margin-bottom" are "auto", their used value is 0.
    //   https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-height
    this.set_margin_top(maybe_margin_top || new LayoutUnit());
    this.set_margin_bottom(maybe_margin_bottom || new LayoutUnit());
  }

  RenderAndAnimateContent(
    border_node_builder: CompositionNodeBuilder,
    stacking_context: ContainerBox) {
    if (this.computed_style().visibility != KeywordValue.GetVisible()) {
      return;
    }

    if (isNil(this.content_)) {
      return;
    }

    if (isNil(this.replaced_box_mode_)) {
      // If we don't have a data stream associated with this video [yet], then
      // we don't yet know if it is punched out or not, and so render black.
      border_node_builder.AddChild(new RectNode(
        new RectF(this.content_box_size().toSizeF()),
        new SolidColorBrush(
          new ColorRGBA(0.0, 0.0, 0.0, 1.0))));
      // Nothing to render.
      return;
    }

    // if (this.replaced_box_mode_ ==  ReplacedBoxMode.kLottie) {
    //   AnimateNode::Builder animate_node_builder;
    //   scoped_refptr<LottieNode> lottie_node =
    //     new LottieNode(nullptr, math::RectF());
    //   animate_node_builder.Add(
    //     lottie_node,
    //     base::Bind(&AnimateLottie, replace_image_cb_, *lottie_properties_,
    //     math::RectF(content_box_size())));
    //   border_node_builder.AddChild(
    //     new AnimateNode(animate_node_builder, lottie_node));
    //   return;
    // }

    this.RenderAndAnimateContentWithLetterboxing(border_node_builder);
  }

  IsTransformable() {
    return true;
  }

  DumpProperties(stream: string): string {
    stream = Box.prototype.DumpProperties.call(this, stream);

    stream += 'text_position=';
    stream += this.text_position_;
    stream += ' ';
    stream += 'bidi_level=';
    stream += this.paragraph_ref_.object.GetBidiLevel(this.text_position_);
    stream += ' ';
    return stream;
  }

  // Updates used values of "margin-left" and "margin-right" properties based on
  // https://www.w3.org/TR/CSS21/visudet.html#block-replaced-width and
  // https://www.w3.org/TR/CSS21/visudet.html#inline-replaced-width.
  protected abstract UpdateHorizontalMargins(
    containing_block_direction: BaseDirection,
    containing_block_width: LayoutUnit,
    border_box_width: LayoutUnit,
    maybe_margin_left: Optional<LayoutUnit>,
    maybe_margin_right: Optional<LayoutUnit>): void

  // private  RenderAndAnimateContentWithMapToMesh(
  //    border_node_builder: :CompositionNodeBuilder,
  //      const cssom::MapToMeshFunction* mtm_function) const;
  private RenderAndAnimateContentWithLetterboxing(
    border_node_builder: CompositionNodeBuilder) {

    // let composition_node_builder = new CompositionNodeBuilder(
    //   new Vector2dF((this.border_left_width().ADD(this.padding_left())).toFloat(),
    //     (this.border_top_width().ADD(this.padding_top())).toFloat()));
    // let composition_node =
    //   new CompositionNode(composition_node_builder);
    switch (this.replaced_box_mode_) {
      case ReplacedBoxMode.kImage : {
        let letterbox_dims = GetLetterboxDimensions(this.content_size_.toSizeF(), this.content_box_size().toSizeF());
        let image = this.content_ as unknown as Image;
        AddLetterboxedImageToRenderTree(letterbox_dims, image, border_node_builder);
        break;
      }
      case ReplacedBoxMode.kFreehand : {
        let path = this.content_ as unknown as Path;
        AddFreehandDrawingToRenderTree(path, border_node_builder);
        break;
      }
      case ReplacedBoxMode.kPunchOutVideo: {
        NOTIMPLEMENTED();
        // let letterbox_dims =
        //   GetLetterboxDimensions(this.content_size_, this.content_box_size());
        // AddLetterboxedPunchThroughVideoNodeToRenderTree(
        //   letterbox_dims, this.set_bounds_cb_, border_node_builder);

      }
      default: {
        NOTIMPLEMENTED();

        // AnimateNode::Builder animate_node_builder;
        // animate_node_builder.Add(composition_node,
        //   base::Bind(&AnimateVideoWithLetterboxing,
        //   replace_image_cb_, content_box_size()));
        // border_node_builder.AddChild(
        //   new AnimateNode(animate_node_builder, composition_node));
      }
    }
  }

  private maybe_intrinsic_width_: Optional<LayoutUnit>;
  private maybe_intrinsic_height_: Optional<LayoutUnit>;
  private intrinsic_ratio_: number;

  private content_: T;

  private paragraph_ref_: IReference<Paragraph>;
  private text_position_: number;
  private replaced_box_mode_: Optional<ReplacedBoxMode>;
  // base::Optional<render_tree::LottieAnimation::LottieProperties>
  //     lottie_properties_;

  AbsoluteQuads(quads: QuadF[], mode: Optional<MapCoordinatesFlags>) {
    NOTIMPLEMENTED();
  }
}

function AddLetterboxedImageToRenderTree(
  dimensions: LetterboxDimensions,
  image: Image,
  composition_node_builder: CompositionNodeBuilder) {
  if (dimensions.image_rect) {
    let image_builder = new ImageNodeBuilder(image, dimensions.image_rect);
    composition_node_builder.AddChild(new ImageNode(image_builder));
  }
}

function AddFreehandDrawingToRenderTree(path: Path, composition_node_builder: CompositionNodeBuilder) {
  composition_node_builder.AddChild(new FreehandNode(path))
}
