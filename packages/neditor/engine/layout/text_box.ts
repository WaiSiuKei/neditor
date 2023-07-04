// Although the CSS 2.1 specification assumes that the text is simply a part of
// an inline box, it is impractical to implement it that way. Instead, we define
// a text box as an anonymous replaced inline-level box that is breakable at
// soft wrap opportunities.
import { Box, LayoutParams, Level } from './box';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { BreakPolicy, GetBreakPolicyFromWrapOpportunityPolicy, Paragraph, TextOrder } from './paragraph';
import {
  GetUsedColor,
  GetUsedLength,
  GetUsedMarginBottomIfNotAuto,
  GetUsedMarginLeftIfNotAuto,
  GetUsedMarginRightIfNotAuto,
  GetUsedMarginTopIfNotAuto,
  UsedLineHeightProvider,
  UsedStyleProvider
} from './used_style';
import { ShouldProcessWrapOpportunityPolicy, WrapAtPolicy, WrapOpportunityPolicy, WrapResult } from './line_wrapping';
import { LayoutUnit } from './layout_unit';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { Optional } from '@neditor/core/base/common/typescript';
import { ContainerBox } from './container_box';
import { CompositionNodeBuilder } from '../render_tree/composition_node';
import { BaseDirection } from './base_direction';
import { FontList } from '../dom/font_list';
import { DCHECK } from '@neditor/core/base/check';
import { KeywordValue } from '../cssom/keyword_value';
import { Font } from '../render_tree/font';
import { DoesAllowTextWrapping, DoesCollapseWhiteSpace } from './white_space_processing';
import { Vector2dF } from '../math/vector2d_f';
import { PropertyListValue } from '../cssom/property_list_value';
import { TextNode, TextNodeBuilder } from '../render_tree/text_node';
import { Node } from '../render_tree/node';
import { DCHECK_LT } from '@neditor/core/base/check_op';
import { ShadowValue } from '../cssom/shadow_value';
import { Shadow } from '../render_tree/shadow';
import { isNil } from '@neditor/core/base/common/type';
import { QuadF } from '../math/quad_f';
import { MapCoordinatesFlags } from './map_coordinates_flags';
import { Rect } from '@neditor/core/base/common/geometry';
import { RectLayoutUnit } from './rect_layout_unit';
import { PointLayoutUnit } from './point_layout_unit';
import { SizeLayoutUnit } from './size_layout_unit';
import { ICopyableReference, IReference } from '../../base/common/lifecycle';
import { Context } from './box_generator';

export class TextBox extends Box {
  constructor(
    css_computed_style_declaration: ComputedStyleDeclaration,
    paragraph_ref: ICopyableReference<Paragraph>,
    text_start_position: number,
    text_end_position: number,
    has_trailing_line_break: boolean,
    is_product_of_split: boolean,
    used_style_provider: UsedStyleProvider,
    //         LayoutStatTracker* layout_stat_tracker,
    private ctx: Context,
  ) {
    super(css_computed_style_declaration, used_style_provider);
    this._register(this.paragraph_ref_ = paragraph_ref);
    this.text_start_position_ = text_start_position;
    this.text_end_position_ = text_end_position;
    this.truncated_text_start_position_ = text_start_position;
    this.truncated_text_end_position_ = text_end_position;
    this.previous_truncated_text_start_position_ = text_start_position;
    this.previous_truncated_text_end_position_ = text_end_position;
    this.truncated_text_offset_from_left_ = 0;
    this.used_font_ = used_style_provider.GetUsedFontList(
      css_computed_style_declaration.data()!.font_family,
      css_computed_style_declaration.data()!.font_size,
      css_computed_style_declaration.data()!.font_style,
      css_computed_style_declaration.data()!.font_weight);
    this.text_has_leading_white_space_ = false;
    this.text_has_trailing_white_space_ = false;
    this.should_collapse_leading_white_space_ = false;
    this.should_collapse_trailing_white_space_ = false;
    this.has_trailing_line_break_ = has_trailing_line_break;
    this.is_product_of_split_ = is_product_of_split;
    this.update_size_results_valid_ = false;
    this.ascent_ = 0;
    DCHECK(this.text_start_position_ <= this.text_end_position_);

    this.UpdateTextHasLeadingWhiteSpace();
    this.UpdateTextHasTrailingWhiteSpace();
  }

  GetLevel(): Level {
    return Level.kInlineLevel;
  }
  override AsTextBox() {
    return this;
  }
  override isTextBox() {
    return true;
  }

  // 扣除控制字符
  GetTextStartPosition() {
    return this.text_start_position_;
  }
  GetTextEndPosition() {
    return this.text_end_position_;
  }
  GetClientRect() {
    const borderBox = this.GetBorderBoxFromRoot(false);
    const left = borderBox.x();
    const top = borderBox.y().SUB(this.GetInlineLevelTopMargin());
    return new RectLayoutUnit(new PointLayoutUnit(left, top), new SizeLayoutUnit(borderBox.width(), this.GetInlineLevelBoxHeight()));
  }

  UpdateContentSizeAndMargins(layout_params: LayoutParams) {
    // Anonymous boxes do not have margins.
    DCHECK(GetUsedMarginLeftIfNotAuto(this.computed_style()!,
      layout_params.containing_block_size)!
      .EqualOrNaN(new LayoutUnit()));
    DCHECK(GetUsedMarginTopIfNotAuto(this.computed_style()!,
      layout_params.containing_block_size)!
      .EqualOrNaN(new LayoutUnit()));
    DCHECK(GetUsedMarginRightIfNotAuto(this.computed_style()!,
      layout_params.containing_block_size)!
      .EqualOrNaN(new LayoutUnit()));
    DCHECK(GetUsedMarginBottomIfNotAuto(this.computed_style()!,
      layout_params.containing_block_size)!
      .EqualOrNaN(new LayoutUnit()));

    // The non-collapsible content size only needs to be calculated if
    // |non_collapsible_text_width_| is unset. This indicates that either the
    // width has not previously been calculated for this box, or that the width
    // was invalidated as the result of a split.
    if (!this.non_collapsible_text_width_) {
      let line_height = this.computed_style()!.line_height;

      // Factor in all of the fonts needed by the text when generating font
      // metrics if the line height is set to normal:
      // "When an element contains text that is rendered in more than one font,
      // user agents may determine the 'normal' 'line-height' value according to
      // the largest font size."
      //   https://www.w3.org/TR/CSS21/visudet.html#line-height
      let use_text_fonts_to_generate_font_metrics = line_height == KeywordValue.GetNormal();

      let text_fonts: Font[] = [];
      let text_start_position = this.GetNonCollapsibleTextStartPosition();
      this.non_collapsible_text_width_ =
        this.HasNonCollapsibleText()
          ? new LayoutUnit(this.used_font_.GetTextWidth(
            this.paragraph.GetText(),
            text_start_position,
            this.GetNonCollapsibleTextLength(),
            this.paragraph.IsRTL(text_start_position),
            use_text_fonts_to_generate_font_metrics ? text_fonts : undefined))
          : new LayoutUnit();

      // The line height values are only calculated when one of two conditions are
      // met:
      //  1. |baseline_offset_from_top_| has not previously been set, meaning that
      //     the line height has never been calculated for this box.
      //  2. |use_text_fonts_to_generate_font_metrics| is true, meaning that the
      //     line height values depend on the content of the text itself. When
      //     this is the case, the line height value is not constant and a split
      //     in the text box can result in the line height values changing.
      if (!this.baseline_offset_from_top_ || use_text_fonts_to_generate_font_metrics) {
        this.set_margin_left(new LayoutUnit());
        this.set_margin_top(new LayoutUnit());
        this.set_margin_right(new LayoutUnit());
        this.set_margin_bottom(new LayoutUnit());

        let font_metrics =
          this.used_font_.GetFontMetrics(text_fonts);

        let used_line_height_provider = new UsedLineHeightProvider(
          font_metrics, this.computed_style()!.font_size);
        line_height.Accept(used_line_height_provider);
        this.set_height(new LayoutUnit(font_metrics.em_box_height()));
        this.baseline_offset_from_top_ =
          used_line_height_provider.baseline_offset_from_top();
        this.line_height_ = used_line_height_provider.used_line_height();
        this.inline_top_margin_ = used_line_height_provider.half_leading();
        this.ascent_ = font_metrics.ascent();
      }
    }

    this.set_width(this.GetLeadingWhiteSpaceWidth().ADD(this.non_collapsible_text_width_).ADD(this.GetTrailingWhiteSpaceWidth()));
  }

  TryWrapAt(wrap_at_policy: WrapAtPolicy,
            wrap_opportunity_policy: WrapOpportunityPolicy,
            is_line_existence_justified: boolean,
            available_width: LayoutUnit,
            should_collapse_trailing_white_space: boolean): WrapResult {
    DCHECK(!this.IsAbsolutelyPositioned());

    let style_allows_break_word = this.computed_style()!.overflow_wrap == KeywordValue.GetBreakWord();

    if (!ShouldProcessWrapOpportunityPolicy(wrap_opportunity_policy, style_allows_break_word)) {
      return WrapResult.kWrapResultNoWrap;
    }

    // Even when the text box's style prevents wrapping, wrapping can still occur
    // before the box if the following requirements are met:
    // - The text box is not the product of a split. If it is, and this box's
    //   style prevents text wrapping, then the previous box also prevents text
    //   wrapping, and no wrap should occur between them.
    // - The line's existence has already been justified. Wrapping cannot occur
    //   prior to that.
    // - Whitespace precedes the text box. This can only occur in the case where
    //   the preceding box allows wrapping, otherwise a no-breaking space will
    //   have been appended (the one exception to this is when this box was the
    //   product of a split, but that case is already handled above).
    if (!DoesAllowTextWrapping(this.computed_style()!.white_space)) {
      if (!this.is_product_of_split_ && is_line_existence_justified &&
        this.text_start_position_ > 0 &&
        this.paragraph.IsCollapsibleWhiteSpace(this.text_start_position_ - 1)) {
        return WrapResult.kWrapResultWrapBefore;
      } else {
        return WrapResult.kWrapResultNoWrap;
      }
    }

    // If the line existence is already justified, then leading whitespace can be
    // included in the wrap search, as it provides a wrappable point. If it isn't,
    // then the leading whitespace is skipped, because the line cannot wrap before
    // it is justified.
    let start_position = is_line_existence_justified
      ? this.text_start_position_
      : this.GetNonCollapsibleTextStartPosition();

    let wrap_position = this.GetWrapPosition(
      wrap_at_policy, wrap_opportunity_policy, is_line_existence_justified,
      available_width, should_collapse_trailing_white_space,
      style_allows_break_word, start_position);

    let wrap_result: WrapResult;
    // Wrapping at the text start position is only allowed when the line's
    // existence is already justified.
    if (wrap_position == this.text_start_position_ && is_line_existence_justified) {
      wrap_result = WrapResult.kWrapResultWrapBefore;
    } else if (wrap_position > start_position &&
      wrap_position < this.text_end_position_) {
      this.SplitAtPosition(wrap_position);
      wrap_result = WrapResult.kWrapResultSplitWrap;
    } else {
      wrap_result = WrapResult.kWrapResultNoWrap;
    }
    return wrap_result;
  }

  GetTextPositionAtVisualLocation(length: number) {
    return this.paragraph.GetTextPositionAtVisualLocation(
      this.paragraph.base_direction(),
      this.used_font_,
      this.text_start_position_,
      this.text_end_position_,
      length);
  }

  GetSplitSibling() {
    return this.split_sibling_;
  }

  DoesFulfillEllipsisPlacementRequirement(): boolean {
    // This box has non-collapsed text and fulfills the requirement that the first
    // character or inline-level element must appear on the line before ellipsing
    // can occur if it has non-collapsed characters.
    //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
    return this.GetNonCollapsedTextStartPosition() < this.GetNonCollapsedTextEndPosition();
  }
  DoPreEllipsisPlacementProcessing() {
    this.previous_truncated_text_start_position_ = this.truncated_text_start_position_;
    this.previous_truncated_text_end_position_ = this.truncated_text_end_position_;
    this.truncated_text_start_position_ = this.text_start_position_;
    this.truncated_text_end_position_ = this.text_end_position_;
  }
  DoPostEllipsisPlacementProcessing() {
    if (this.previous_truncated_text_start_position_ !=
      this.truncated_text_start_position_ ||
      this.previous_truncated_text_end_position_ != this.truncated_text_end_position_) {
      this.InvalidateRenderTreeNodesOfBoxAndAncestors();
    }
  }

  SplitBidiLevelRuns() {
  }
  TrySplitAtSecondBidiLevelRun(): boolean {
    let { next_run_position: split_position, result } = this.paragraph.GetNextRunPosition(this.text_start_position_);
    if (result) {
      DCHECK(!isNil(split_position));
      if (split_position! < this.text_end_position_) {
        this.SplitAtPosition(split_position!);
        return true;
      }
      NOTREACHED();
    } else {
      return false;
    }
  }
  GetBidiLevel(): Optional<number> {
    return this.paragraph.GetBidiLevel(this.text_start_position_);
  }

  SetShouldCollapseLeadingWhiteSpace(
    should_collapse_leading_white_space: boolean) {
    if (this.should_collapse_leading_white_space_ !=
      should_collapse_leading_white_space) {
      this.should_collapse_leading_white_space_ = should_collapse_leading_white_space;
      this.update_size_results_valid_ = false;
    }
  }
  SetShouldCollapseTrailingWhiteSpace(
    should_collapse_trailing_white_space: boolean) {
    if (this.should_collapse_trailing_white_space_ !=
      should_collapse_trailing_white_space) {
      this.should_collapse_trailing_white_space_ =
        should_collapse_trailing_white_space;
      this.update_size_results_valid_ = false;
    }
  }
  HasLeadingWhiteSpace(): boolean {
    return this.text_has_leading_white_space_ &&
      !this.should_collapse_leading_white_space_ &&
      (this.HasNonCollapsibleText() || !this.should_collapse_trailing_white_space_);
  }
  HasTrailingWhiteSpace(): boolean {
    return this.text_has_trailing_white_space_ &&
      !this.should_collapse_trailing_white_space_ &&
      (this.HasNonCollapsibleText() || !this.should_collapse_leading_white_space_);
  }
  IsCollapsed(): boolean {
    return !this.HasLeadingWhiteSpace() && !this.HasTrailingWhiteSpace() &&
      !this.HasNonCollapsibleText();
  }

  JustifiesLineExistence(): boolean {
    return this.HasNonCollapsibleText() || this.has_trailing_line_break_;
  }
  HasTrailingLineBreak(): boolean {
    return this.has_trailing_line_break_;
  }
  AffectsBaselineInBlockFormattingContext(): boolean {
    NOTREACHED('Should only be called in a block formatting context.');
  }
  GetBaselineOffsetFromTopMarginEdge(): LayoutUnit {
    return this.baseline_offset_from_top_ || new LayoutUnit();
  }
  GetInlineLevelBoxHeight(): LayoutUnit {
    return this.line_height_!;
  }
  GetInlineLevelTopMargin(): LayoutUnit {
    return this.inline_top_margin_!;
  }

  ValidateUpdateSizeInputs(params: LayoutParams): boolean {
    // Also take into account mutable local state about (at least) whether white
    // space should be collapsed or not.
    if (Box.prototype.ValidateUpdateSizeInputs.call(this, params) && this.update_size_results_valid_) {
      return true;
    } else {
      this.update_size_results_valid_ = true;
      return false;
    }
  }

  HasNonCollapsibleText(): boolean {
    return this.GetNonCollapsibleTextLength() > 0;
  }

  // From |Box|.
  RenderAndAnimateContent(
    border_node_builder: CompositionNodeBuilder,
    stacking_context: ContainerBox) {
    if (this.computed_style()!.visibility != KeywordValue.GetVisible()) {
      return;
    }

    DCHECK((this.border_left_width().ADD(this.padding_left())).EqualOrNaN(new LayoutUnit()));
    DCHECK((this.border_top_width().ADD(this.padding_top())).EqualOrNaN(new LayoutUnit()));

    // Only add the text node to the render tree if it actually has visible
    // content that isn't simply collapsible whitespace and a font isn't loading.
    // The font is treated as transparent if a font is currently being downloaded
    // and hasn't timed out: "In cases where textual content is loaded before
    // downloadable fonts are available, user agents may... render text
    // transparently with fallback fonts to avoid a flash of text using a fallback
    // font. In cases where the font download fails user agents must display text,
    // simply leaving transparent text is considered non-conformant behavior."
    //   https://www.w3.org/TR/css3-fonts/#font-face-loading
    if (this.HasNonCollapsibleText() && this.HasVisibleText() && this.used_font_.IsVisible()) {
      // let is_color_animated = animations().IsPropertyAnimated(cssom::kColorProperty);

      let used_color = GetUsedColor(this.computed_style()!.color);

      let text_shadow = this.computed_style()!.text_shadow;

      // Only render the text if it is not completely transparent, or if the
      // color is animated, in which case it could become non-transparent.
      if (used_color.a() > 0.0 || /*is_color_animated || */text_shadow != KeywordValue.GetNone()) {
        let text_start_position = this.GetVisibleTextStartPosition();
        let text_length = this.GetVisibleTextLength();

        let glyph_buffer =
          this.used_font_.CreateGlyphBuffer(
            this.paragraph.GetText(),
            text_start_position,
            text_length,
            this.paragraph.IsRTL(text_start_position));

        let text_node_builder = new TextNodeBuilder(
          new Vector2dF(this.truncated_text_offset_from_left_, this.ascent_),
          glyph_buffer, used_color);

        if (text_shadow != KeywordValue.GetNone()) {
          let shadow_list = this.computed_style()!.text_shadow as PropertyListValue;

          AddTextShadows(text_node_builder, shadow_list);
        }

        let text_node = new TextNode(text_node_builder);

        // The render tree API considers text coordinates to be a position
        // of a baseline, offset the text node accordingly.
        let node_to_add: Node;
        // if (is_color_animated) {
        //   render_tree::animations::AnimateNode::Builder animate_node_builder;
        //   AddAnimations<render_tree::TextNode>(
        //     base::Bind(&PopulateBaseStyleForTextNode),
        //   base::Bind(&SetupTextNodeFromStyle),
        // *css_computed_style_declaration(), text_node,
        // &animate_node_builder);
        //   node_to_add = new render_tree::animations::AnimateNode(
        //     animate_node_builder, text_node);
        // } else {
        node_to_add = text_node;
        // }
        border_node_builder.AddChild(node_to_add);
      }
    }
  }
  IsTransformable(): boolean {
    return false;
  }

  DumpClassName(stream: string): string {
    return stream += 'TextBox ';
  }
  DumpProperties(stream: string): string {
    stream = Box.prototype.DumpProperties.call(this, stream);

    stream += 'text_start=';
    stream += this.text_start_position_;
    stream += ' ';
    stream += 'text_end=';
    stream += this.text_end_position_;
    stream += ' ';

    stream += `visible_text_start=${this.GetVisibleTextStartPosition()} `;
    stream += `visible_text_end=${this.GetVisibleTextEndPosition()} `;

    stream += 'line_height=';
    stream += this.line_height_;
    stream += ' ';
    stream += 'inline_top_margin=';
    stream += this.inline_top_margin_;
    stream += ' ';
    stream += 'has_leading_white_space=';
    stream += this.HasLeadingWhiteSpace();
    stream += ' ';
    stream += 'has_trailing_white_space=';
    stream += this.HasTrailingWhiteSpace();
    stream += ' ';

    stream += 'bidi_level=';
    stream += this.paragraph.GetBidiLevel(this.text_start_position_);
    stream += ' ';

    return stream;
  }
  DumpChildrenWithIndent(stream: string, indent: number): string {
    stream = Box.prototype.DumpChildrenWithIndent.call(this, stream, indent);

    stream = this.DumpIndent(stream, indent);

    stream += '"';
    stream += this.GetNonCollapsibleText();
    stream += '"\n';
    return stream;
  }

  DoPlaceEllipsisOrProcessPlacedEllipsis(
    base_direction: BaseDirection,
    desired_offset: LayoutUnit,
    is_placement_requirement_met: boolean,
    is_placed: boolean,
    placed_offset: LayoutUnit): { is_placement_requirement_met: boolean, is_placed: boolean, placed_offset: LayoutUnit } {
    // If the ellipsis has already been placed, then the text is fully truncated
    // by the ellipsis.
    if (is_placed) {
      if (this.paragraph.AreInlineAndScriptDirectionsTheSame(base_direction,
        this.text_start_position_)) {
        this.truncated_text_end_position_ = this.text_start_position_;
      } else {
        this.truncated_text_start_position_ = this.text_end_position_;
      }
      return {
        is_placement_requirement_met,
        is_placed,
        placed_offset
      };
    }

    // Otherwise, the ellipsis is being placed somewhere within this text box.
    is_placed = true;

    let content_box_start_offset =
      this.GetContentBoxStartEdgeOffsetFromContainingBlock(base_direction);

    // Determine the available width in the content before to the desired offset.
    // This is the distance from the start edge of the content box to the desired
    // offset.
    let desired_content_offset =
      base_direction == BaseDirection.kRightToLeftBaseDirection
        ? content_box_start_offset.SUB(desired_offset)
        : desired_offset.SUB(content_box_start_offset);

    let start_position = this.GetNonCollapsedTextStartPosition();
    let end_position = this.GetNonCollapsedTextEndPosition();

    // Attempt to find a break position allowing breaks anywhere within the text,
    // and not simply at soft wrap locations. If the placement requirement has
    // already been satisfied, then the ellipsis can appear anywhere within the
    // text box. Otherwise, it can only appear after the first character
    // (https://www.w3.org/TR/css3-ui/#propdef-text-overflow).
    let { result, break_width, break_position } = this.paragraph.FindBreakPosition(
      base_direction, false, this.used_font_, start_position, end_position,
      desired_content_offset, false, !(is_placement_requirement_met),
      BreakPolicy.kBreakPolicyBreakWord);
    let found_position = break_position;
    let found_offset = break_width;
    if (result) {
      // A usable break position was found. Calculate the placed offset using the
      // the break position's distance from the content box's start edge. In the
      // case where the base direction is right-to-left, the truncated text must
      // be offset to begin after the ellipsis.
      if (base_direction == BaseDirection.kRightToLeftBaseDirection) {
        placed_offset = content_box_start_offset.SUB(found_offset);
        this.truncated_text_offset_from_left_ =
          (placed_offset.SUB(this.GetContentBoxLeftEdgeOffsetFromContainingBlock()))
            .toFloat();
      } else {
        placed_offset = content_box_start_offset.ADD(found_offset);
      }
      if (this.paragraph.AreInlineAndScriptDirectionsTheSame(base_direction,
        start_position)) {
        this.truncated_text_end_position_ = found_position;
      } else {
        this.truncated_text_start_position_ = found_position;
      }
      // An acceptable break position was not found. If the placement requirement
      // was already met prior to this box, then the ellipsis doesn't require a
      // character from this box to appear prior to its position, so simply place
      // the ellipsis at the start edge of the box and fully truncate the text.
    } else if (is_placement_requirement_met) {
      placed_offset =
        this.GetMarginBoxStartEdgeOffsetFromContainingBlock(base_direction);
      if (this.paragraph.AreInlineAndScriptDirectionsTheSame(base_direction,
        start_position)) {
        this.truncated_text_end_position_ = this.text_start_position_;
      } else {
        this.truncated_text_start_position_ = this.text_end_position_;
      }
      // The placement requirement has not already been met. Given that an
      // acceptable break position was not found within the text, the ellipsis can
      // only be placed at the end edge of the box.
    } else {
      placed_offset =
        this.GetMarginBoxEndEdgeOffsetFromContainingBlock(base_direction);
    }
    return {
      is_placement_requirement_met,
      is_placed,
      placed_offset
    };
  }

  public get paragraph(): Paragraph {
    return this.paragraph_ref_.object;
  }

  private UpdateTextHasLeadingWhiteSpace() {
    this.text_has_leading_white_space_ =
      this.text_start_position_ != this.text_end_position_ &&
      this.paragraph.IsCollapsibleWhiteSpace(this.text_start_position_) &&
      DoesCollapseWhiteSpace(this.computed_style()!.white_space);
  }
  private UpdateTextHasTrailingWhiteSpace() {
    this.text_has_trailing_white_space_ =
      !this.has_trailing_line_break_ && this.text_start_position_ != this.text_end_position_ &&
      this.paragraph.IsCollapsibleWhiteSpace(this.text_end_position_ - 1) &&
      DoesCollapseWhiteSpace(this.computed_style()!.white_space);
  }

  private GetWrapPosition(
    wrap_at_policy: WrapAtPolicy,
    wrap_opportunity_policy: WrapOpportunityPolicy,
    is_line_existence_justified: boolean,
    available_width: LayoutUnit,
    should_collapse_trailing_white_space: boolean,
    style_allows_break_word: boolean,
    start_position: number,
  ): number {
    let break_policy =
      GetBreakPolicyFromWrapOpportunityPolicy(
        wrap_opportunity_policy, style_allows_break_word);

    let wrap_position = -1;
    switch (wrap_at_policy) {
      case WrapAtPolicy.kWrapAtPolicyBefore:
        // Wrapping before the box is only permitted when the line's existence is
        // justified.
        if (is_line_existence_justified &&
          this.paragraph.IsBreakPosition(this.text_start_position_, break_policy)) {
          wrap_position = this.text_start_position_;
        } else {
          wrap_position = -1;
        }
        break;
      case WrapAtPolicy.kWrapAtPolicyLastOpportunityWithinWidth: {
        if (is_line_existence_justified) {
          // If the line existence is already justified, then the line can
          // potentially wrap after the box's leading whitespace. However, if that
          // whitespace has been collapsed, then we need to add its width to the
          // available width, because it'll be counted against the available width
          // while searching for the break position, but it won't impact the
          // length of the line.
          if (start_position != this.GetNonCollapsedTextStartPosition()) {
            available_width.ADD_ASSIGN(new LayoutUnit(this.used_font_.GetSpaceWidth()));
          }
          // If the line's existence isn't already justified, then the line cannot
          // wrap on leading whitespace. Subtract the width of non-collapsed
          // whitespace from the available width, as the search is starting after
          // it.
        } else {
          available_width.SUB_ASSIGN(this.GetLeadingWhiteSpaceWidth());
        }

        // Attempt to find the last break position after the start position that
        // fits within the available width. Overflow is never allowed.
        let wrap_width: LayoutUnit;
        let { break_width, break_position, result } = this.paragraph.FindBreakPosition(
          this.paragraph.base_direction(), true, this.used_font_, start_position,
          this.text_end_position_, available_width,
          should_collapse_trailing_white_space, false, break_policy);
        wrap_position = break_position;
        wrap_width = break_width;
        if (!result) {
          // If no break position is found, but the line existence is already
          // justified, then check for text start position being a break position.
          // Wrapping before the box is permitted when the line's existence is
          // justified.
          if (is_line_existence_justified &&
            this.paragraph.IsBreakPosition(this.text_start_position_, break_policy)) {
            wrap_position = this.text_start_position_;
          } else {
            wrap_position = -1;
          }
        }
        break;
      }
      case WrapAtPolicy.kWrapAtPolicyLastOpportunity:
        wrap_position = this.paragraph.GetPreviousBreakPosition(this.text_end_position_,
          break_policy);
        break;
      case WrapAtPolicy.kWrapAtPolicyFirstOpportunity: {
        // If the line is already justified, the wrap can occur at the start
        // position. Otherwise, the wrap cannot occur until after non-collapsible
        // text is included.
        let search_start_position =
          is_line_existence_justified ? start_position - 1 : start_position;
        wrap_position =
          this.paragraph.GetNextBreakPosition(search_start_position, break_policy);
        break;
      }
    }
    return wrap_position;
  }

  // Split the text box into two.
  // |split_start_position| indicates the position within the paragraph where
  // the split occurs and the second box begins
  private SplitAtPosition(split_start_position: number) {
    let split_end_position = this.text_end_position_;
    DCHECK_LT(split_start_position, split_end_position);

    this.text_end_position_ = split_start_position;
    this.truncated_text_end_position_ = this.text_end_position_;

    // The width is no longer valid for this box now that it has been split.
    this.update_size_results_valid_ = false;
    this.non_collapsible_text_width_ = undefined;

    const kIsProductOfSplitTrue = true;

    let box_after_split = new TextBox(
      this.css_computed_style_declaration(),
      this.paragraph_ref_.copy(),
      split_start_position,
      split_end_position, this.has_trailing_line_break_, kIsProductOfSplitTrue,
      this.used_style_provider()/*, layout_stat_tracker()*/,
      this.ctx);
    box_after_split.node = this.node;
    this.node!.GetLayoutObject().AsLayoutTexes()!.Append(box_after_split);

    // Update the split sibling links.
    box_after_split.split_sibling_ = this.split_sibling_;
    this.split_sibling_ = box_after_split;

    // TODO: Set the text width of the box after split to
    //       |text_width_ - pre_split_width| to save a call to Skia/HarfBuzz.

    // Pass the trailing line break on to the sibling that retains the trailing
    // portion of the text and reset the value for this text box.
    this.has_trailing_line_break_ = false;

    // Update the paragraph end position white space now that this text box has
    // a new end position. The start position white space does not need to be
    // updated as it has not changed.
    this.UpdateTextHasTrailingWhiteSpace();
  }

  // Width of a space character in the used font, if the box has leading white
  // space.
  private GetLeadingWhiteSpaceWidth(): LayoutUnit {
    return this.HasLeadingWhiteSpace() ? new LayoutUnit(this.used_font_.GetSpaceWidth())
      : new LayoutUnit();
  }
  // Width of a space character in the used font, if the box has trailing white
  // space.
  private GetTrailingWhiteSpaceWidth(): LayoutUnit {
    return this.HasTrailingWhiteSpace() && this.HasNonCollapsibleText()
      ? new LayoutUnit(this.used_font_.GetSpaceWidth())
      : new LayoutUnit();
  }

  private GetNonCollapsedTextStartPosition(): number {
    return this.should_collapse_leading_white_space_
      ? this.GetNonCollapsibleTextStartPosition()
      : this.text_start_position_;
  }
  private GetNonCollapsedTextEndPosition(): number {
    return this.should_collapse_trailing_white_space_
      ? this.GetNonCollapsibleTextEndPosition()
      : this.text_end_position_;
  }

  private GetNonCollapsibleTextStartPosition(): number {
    return this.text_has_leading_white_space_ ? this.text_start_position_ + 1
      : this.text_start_position_;
  }
  private GetNonCollapsibleTextEndPosition(): number {
    return this.text_has_trailing_white_space_ ? this.text_end_position_ - 1
      : this.text_end_position_;
  }
  private GetNonCollapsibleTextLength(): number {
    return this.GetNonCollapsibleTextEndPosition() -
      this.GetNonCollapsibleTextStartPosition();
  }
  private GetNonCollapsibleText(): string {
    return this.paragraph.RetrieveUtf8SubString(this.GetNonCollapsibleTextStartPosition(),
      this.GetNonCollapsibleTextEndPosition(),
      TextOrder.kVisualTextOrder);
  }

  private GetVisibleTextStartPosition(): number {
    return Math.max(this.GetNonCollapsedTextStartPosition(),
      this.truncated_text_start_position_);
  }
  private GetVisibleTextEndPosition(): number {
    return Math.min(this.GetNonCollapsedTextEndPosition(),
      this.truncated_text_end_position_);
  }
  private GetVisibleTextLength(): number {
    return this.GetVisibleTextEndPosition() - this.GetVisibleTextStartPosition();
  }
  private HasVisibleText(): boolean {
    return this.GetVisibleTextLength() > 0;
  }
  private GetVisibleText(): string {
    return this.paragraph.RetrieveUtf8SubString(this.GetVisibleTextStartPosition(),
      this.GetVisibleTextEndPosition(),
      TextOrder.kVisualTextOrder);
  }

  // The paragraph that this text box is part of. It contains access to the
  // underlying text, and handles the logic for determining bidi levels and
  // where to split the text box during line breaking when the text box does
  // not fully fit on a line.
  private paragraph_ref_: ICopyableReference<Paragraph>;
  // The position within the paragraph where the text contained in this box
  // begins.
  private text_start_position_: number;
  // The position within the paragraph where the text contained in this box
  // ends.
  private text_end_position_: number;
  // The position within the paragraph where the text within the text box is
  // truncated by an ellipsis and will not be visible.
  // "Implementations must hide characters and atomic inline-level elements at
  // the applicable edge(s) of the line as necessary to fit the ellipsis."
  //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
  private truncated_text_start_position_: number;
  private truncated_text_end_position_: number;
  // Tracking of the previous value of the truncated text position, which
  // allows for determination of whether or not the value changed during
  // ellipsis placement. When this occurs, the cached render tree nodes of this
  // box and its ancestors are invalidated.
  private previous_truncated_text_start_position_: number;
  private previous_truncated_text_end_position_: number;
  // The horizontal offset to apply to rendered text as a result of an ellipsis
  // truncating the text. This value can be non-zero when the text box is in a
  // line with a right-to-left base direction. In this case, when an ellipsis is
  // placed, the truncated text is offset to begin to the right of the ellipsis.
  private truncated_text_offset_from_left_: number;

  // A font used for text width and line height calculations.
  private used_font_: FontList;

  // Whitespace tracking.
  private text_has_leading_white_space_: boolean;
  private text_has_trailing_white_space_: boolean;
  private should_collapse_leading_white_space_: boolean;
  private should_collapse_trailing_white_space_: boolean;

  // Specifies whether this text box ends the line it is on, forcing any
  // additional sibling boxes to be added to a new line.
  private has_trailing_line_break_: boolean;

  // A vertical offset of the baseline relatively to the origin of the text box.
  private baseline_offset_from_top_: Optional<LayoutUnit>;

  // Specifies whether or not this text box was created as a result of the split
  // of a text box.
  private is_product_of_split_: boolean;

  // A reference to the next text box in a linked list of text boxes produced
  // from splits of the initial text box. This enables HTMLElement to retain
  // access to all of its layout boxes after they are split.
  private split_sibling_?: TextBox;

  private update_size_results_valid_: boolean;
  private line_height_?: LayoutUnit;
  private inline_top_margin_?: LayoutUnit;
  private ascent_: number;

  // The width of the portion of the text that is unaffected by whitespace
  // collapsing.
  private non_collapsible_text_width_: Optional<LayoutUnit>;

  AbsoluteQuads(quads: QuadF[],
                mode: MapCoordinatesFlags) {
    NOTIMPLEMENTED();
    // CollectLineBoxRects([this, &quads, mode](const PhysicalRect& r) {
    // quads.push_back(LocalRectToAbsoluteQuad(r, mode));
// });
  }
  RectOfSlice(anchorOffset: number, focusOffset: number) {
    const anchorOffsetInParagraph = anchorOffset;
    const focusOffsetInParagraph = focusOffset;
    const start = Math.max(anchorOffsetInParagraph, this.text_start_position_);
    const end = Math.min(focusOffsetInParagraph, this.text_end_position_);
    const startLocation = this.paragraph.GetSubstrWidth(
      this.paragraph.base_direction(),
      this.used_font_,
      this.text_start_position_,
      start - this.text_start_position_
    );
    const endLocation = end === start ? startLocation : this.paragraph.GetSubstrWidth(
      this.paragraph.base_direction(),
      this.used_font_,
      this.text_start_position_,
      end - this.text_start_position_
    );
    const borderBox = this.GetBorderBoxFromRoot(false);
    const h = this.GetInlineLevelBoxHeight().toFloat();
    const y = borderBox.y().SUB(this.GetInlineLevelTopMargin()).toFloat();
    const offsetX = borderBox.x().toFloat();
    const left = Math.min(startLocation, endLocation);
    return new Rect(offsetX + left, y, Math.abs(endLocation - startLocation), h);
  }
}

function AddTextShadows(builder: TextNodeBuilder,
                        shadow_list: PropertyListValue) {
  if (shadow_list.value().length === 0) {
    return;
  }

  // builder.shadows.emplace();
  // builder.shadows.reserve(shadow_list.value().size());

  for (let s = 0; s < shadow_list.value().length; ++s) {
    let shadow_value =
      shadow_list.value()[s] as ShadowValue;

    let offset = new Vector2dF(shadow_value.offset_x().value(),
      shadow_value.offset_y().value());

    // Since most of a Gaussian fits within 3 standard deviations from
    // the mean, we setup here the Gaussian blur sigma to be a third of
    // the blur radius.
    let shadow_blur_sigma =
      shadow_value.blur_radius()
        ? GetUsedLength(shadow_value.blur_radius()).toFloat() / 3.0
        : 0.0;

    let shadow_color = GetUsedColor(shadow_value.color());

    builder.shadows.push(
      new Shadow(offset, shadow_blur_sigma, shadow_color));
  }
}

