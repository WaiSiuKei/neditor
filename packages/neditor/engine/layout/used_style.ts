import { HTMLElementContext } from '../dom/html_element_context';
import { FontCache } from '../dom/font_cache';
import { SizeF } from '../math/size_f';
import { RoundedCorner } from '../render_tree/rounded_corners';
import { NotReachedPropertyValueVisitor } from '../cssom/property_value_visitor';
import { LengthUnit, LengthValue } from '../cssom/length_value';
import { PercentageValue } from '../cssom/percentage_value';
import { LayoutUnit } from './layout_unit';
import { ComputedStyleData } from '../cssom/computed_style_data';
import { SizeLayoutUnit } from './size_layout_unit';
import { Optional } from '@neditor/core/base/common/typescript';
import { DCHECK_EQ } from '@neditor/core/base/check_op';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { KeywordValue, Value } from '../cssom/keyword_value';
import { PropertyValue } from '../cssom/property_value';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import { ColorRGBA } from '../render_tree/color_rgba';
import { RGBAColorValue } from '../cssom/rgba_color_value';
import { RectF } from '../math/rect_f';
import { Vector2dF } from '../math/vector2d_f';
import { PropertyListValue } from '../cssom/property_list_value';
import { CalcValue } from '../cssom/calc_value';
import { FontList, FontListKey } from '../dom/font_list';
import { FontStyleValue, FontStyleEnum } from '../cssom/font_style_value';
import { StringValue } from '../cssom/string_value';
import { FontWeightValue, FontWeightEnum } from '../cssom/font_weight_value';
import { FontMetrics, FontStyle, Slant, Weight } from '../render_tree/font';
import { NumberValue } from '../cssom/number_value';

export class UsedStyleProvider {
  font_cache_: FontCache;
  // |font_list_key_| is retained in between lookups so that the font names
  // vector will not need to allocate elements each time that it is populated.
  font_list_key_: FontListKey = new FontListKey();

  // The last_font member variables are used to speed up |GetUsedFontList()|.
  // Around 85% of the time in current clients, the current font list matches
  // the last font list, so immediately comparing the current font list's
  // properties against the last font list's properties, prior to updating the
  // font list key and performing a font cache lookup, results in a significant
  // performance improvement.
  last_font_family_refptr_?: PropertyValue;
  last_font_style_refptr_?: PropertyValue;
  last_font_weight_refptr_?: PropertyValue;
  last_font_list_?: FontList;
  constructor(
    html_element_context: HTMLElementContext,
    font_cache: FontCache
  ) {
    this.font_cache_ = font_cache;
  }

  GetUsedFontList(
    font_family_refptr: PropertyValue,
    font_size_refptr: PropertyValue,
    font_style_refptr: PropertyValue,
    font_weight_refptr: PropertyValue): FontList {
    // Grab the font size prior to making the last font comparisons. The reason
    // that font size does not use the same property value comparisons as the
    // the rest of the properties is that the mechanism for generating a computed
    // font size results in numerous font size property values with the same
    // underlying size. Comparing the font size property pointer results in many
    // font lists with identical values incorrectly being treated as different.
    // This issue does not occur with the other font properties.
    let font_size = GetFontSize(font_size_refptr);

    // Check if the last font list matches the current font list. If it does, then
    // it can simply be returned.
    if (this.last_font_list_ && this.last_font_list_.size() == font_size &&
      this.last_font_family_refptr_ == font_family_refptr &&
      this.last_font_style_refptr_ == font_style_refptr &&
      this.last_font_weight_refptr_ == font_weight_refptr) {
      return this.last_font_list_!;
    }

    // Populate the font list key
    this.font_list_key_.family_names.length = 0;
    let font_family_provider = new UsedFontFamilyProvider(this.font_list_key_.family_names);
    font_family_refptr.Accept(font_family_provider);

    let font_style = font_style_refptr as FontStyleValue;
    let font_weight = font_weight_refptr as FontWeightValue;
    this.font_list_key_.style = ConvertCSSOMFontValuesToRenderTreeFontStyle(
      font_style.value(), font_weight.value());

    this.font_list_key_.size = font_size;

    // Update the last font properties and grab the new last font list from the
    // font cache. In the case where it did not previously exist, the font cache
    // will create it.
    this.last_font_family_refptr_ = font_family_refptr;
    this.last_font_style_refptr_ = font_style_refptr;
    this.last_font_weight_refptr_ = font_weight_refptr;
    this.last_font_list_ = this.font_cache_.GetFontList(this.font_list_key_);

    return this.last_font_list_;
  }

  CleanupAfterLayout() {
    // Clear out the last font properties prior to requesting that the font cache
    // process inactive font lists. The reason for this is that the font cache
    // will look for any font lists where it holds the exclusive reference, and
    // the |last_font_list_| could potentially hold a second reference, thereby
    // interfering with the processing.
    this.last_font_family_refptr_ = undefined;
    this.last_font_style_refptr_ = undefined;
    this.last_font_weight_refptr_ = undefined;
    this.last_font_list_ = undefined;

    // this.font_cache_.ProcessInactiveFontListsAndFonts();
  }
}

function GetFontSize(font_size_refptr: PropertyValue): number {
  let font_size_length = font_size_refptr as LengthValue;
  DCHECK_EQ(LengthUnit.kPixelsUnit, font_size_length.unit());
  return font_size_length.value();
}

export class UsedBorderRadiusProvider extends NotReachedPropertyValueVisitor {
  private frame_size_: SizeF;
  private rounded_corner_?: RoundedCorner;

  constructor(frame_size: SizeF) {
    super();
    this.frame_size_ = frame_size;
  }

  VisitLength(length: LengthValue) {
    if (length.value() > 0) {
      this.rounded_corner_ = new RoundedCorner(length.value(), length.value());
    } else {
      this.rounded_corner_ = undefined;
    }
  }
  VisitPercentage(percentage: PercentageValue) {
    if (percentage.value() > 0) {
      this.rounded_corner_ = new RoundedCorner(percentage.value() * this.frame_size_.width(),
        percentage.value() * this.frame_size_.height());
    } else {
      this.rounded_corner_ = undefined;
    }
  }

  rounded_corner() {
    return this.rounded_corner_;
  }
}

// TODO: Factor in generic families.
//   https://www.w3.org/TR/css3-fonts/#font-family-prop
export class UsedFontFamilyProvider extends NotReachedPropertyValueVisitor {
  private family_names_: string[];
  constructor(family_names: string[]) {
    super();
    this.family_names_ = family_names;
  }

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kCurrentColor:
      case Value.kCursive:
      case Value.kFantasy:
      case Value.kMonospace:
      case Value.kSansSerif:
      case Value.kSerif:
        this.family_names_.push(keyword.ToString());
        break;
      case Value.kAbsolute:
      case Value.kAlternate:
      case Value.kAlternateReverse:
      case Value.kAuto:
      case Value.kBackwards:
      case Value.kBaseline:
      case Value.kBlock:
      case Value.kBoth:
      case Value.kBottom:
      case Value.kBreakWord:
      case Value.kCenter:
      case Value.kClip:
      case Value.kCollapse:
      case Value.kColumn:
      case Value.kColumnReverse:
      case Value.kContain:
      case Value.kContent:
      case Value.kCover:
      case Value.kEllipsis:
      case Value.kEnd:
      case Value.kEquirectangular:
      case Value.kFixed:
      case Value.kFlex:
      case Value.kFlexEnd:
      case Value.kFlexStart:
      case Value.kForwards:
      case Value.kHidden:
      case Value.kInfinite:
      case Value.kInherit:
      case Value.kInitial:
      case Value.kInline:
      case Value.kInlineBlock:
      case Value.kInlineFlex:
      case Value.kLeft:
      case Value.kLineThrough:
      case Value.kMiddle:
      case Value.kMonoscopic:
      case Value.kNone:
      case Value.kNoRepeat:
      case Value.kNormal:
      case Value.kNowrap:
      case Value.kPre:
      case Value.kPreLine:
      case Value.kPreWrap:
      case Value.kRelative:
      case Value.kRepeat:
      case Value.kReverse:
      case Value.kRight:
      case Value.kRow:
      case Value.kRowReverse:
      case Value.kScroll:
      case Value.kSolid:
      case Value.kSpaceAround:
      case Value.kSpaceBetween:
      case Value.kStart:
      case Value.kStatic:
      case Value.kStereoscopicLeftRight:
      case Value.kStereoscopicTopBottom:
      case Value.kStretch:
      case Value.kTop:
      case Value.kUppercase:
      case Value.kVisible:
      case Value.kWrap:
      case Value.kWrapReverse:
        NOTREACHED();
    }
  }
  VisitPropertyList(property_list: PropertyListValue) {
    let size = property_list.value().length;
    for (let i = 0; i < size; ++i) {
      property_list.value()[i].Accept(this);
    }
  }
  VisitString(string: StringValue) {
    this.family_names_.push(string.value());
  }
}

class UsedLengthValueProvider extends NotReachedPropertyValueVisitor {
  private percentage_base_: LayoutUnit;
  private calc_permitted_: boolean;
  private used_length_: Optional<LayoutUnit>;
  protected depends_on_containing_block_: boolean = false;

  constructor(percentage_base: LayoutUnit, calc_permitted = false) {
    super();
    this.percentage_base_ = percentage_base;
    this.calc_permitted_ = calc_permitted;
  }

  VisitLength(length: LengthValue) {
    this.depends_on_containing_block_ = false;

    DCHECK_EQ(LengthUnit.kPixelsUnit, length.unit());
    this.used_length_ = new LayoutUnit(length.value());
  }

  VisitPercentage(percentage: PercentageValue) {
    this.depends_on_containing_block_ = true;
    this.used_length_ = this.percentage_base_.MUL(percentage.value());
  }

  // VisitCalc(calc: CalcValue) {
  //   if (!this.calc_permitted_) {
  //     NOTREACHED();
  //   }
  //   this.depends_on_containing_block_ = true;
  //   this.used_length_ = new LayoutUnit(calc.length_value().value()).ADD(
  //     this.percentage_base_.MUL(calc.percentage_value().value()));
  // }

  depends_on_containing_block() {
    return this.depends_on_containing_block_;
  }
  used_length() {
    return this.used_length_;
  }
}

class UsedLengthProvider extends UsedLengthValueProvider {
  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
        this.depends_on_containing_block_ = true;

        // Leave |used_length_| in disengaged state to indicate that "auto"
        // was the value.
        break;

      case Value.kAbsolute:
      case Value.kAlternate:
      case Value.kAlternateReverse:
      case Value.kBackwards:
      case Value.kBaseline:
      case Value.kBlock:
      case Value.kBoth:
      case Value.kBottom:
      case Value.kBreakWord:
      case Value.kCenter:
      case Value.kClip:
      case Value.kCollapse:
      case Value.kColumn:
      case Value.kColumnReverse:
      case Value.kContain:
      case Value.kContent:
      case Value.kCover:
      case Value.kCurrentColor:
      case Value.kCursive:
      case Value.kEllipsis:
      case Value.kEnd:
      case Value.kEquirectangular:
      case Value.kFantasy:
      case Value.kFixed:
      case Value.kFlex:
      case Value.kFlexEnd:
      case Value.kFlexStart:
      case Value.kForwards:
      case Value.kHidden:
      case Value.kInfinite:
      case Value.kInherit:
      case Value.kInitial:
      case Value.kInline:
      case Value.kInlineBlock:
      case Value.kInlineFlex:
      case Value.kLeft:
      case Value.kLineThrough:
      case Value.kMiddle:
      case Value.kMonoscopic:
      case Value.kMonospace:
      case Value.kNone:
      case Value.kNoRepeat:
      case Value.kNormal:
      case Value.kNowrap:
      case Value.kPre:
      case Value.kPreLine:
      case Value.kPreWrap:
      case Value.kRelative:
      case Value.kRepeat:
      case Value.kReverse:
      case Value.kRight:
      case Value.kRow:
      case Value.kRowReverse:
      case Value.kSansSerif:
      case Value.kScroll:
      case Value.kSerif:
      case Value.kSolid:
      case Value.kSpaceAround:
      case Value.kSpaceBetween:
      case Value.kStart:
      case Value.kStatic:
      case Value.kStereoscopicLeftRight:
      case Value.kStereoscopicTopBottom:
      case Value.kStretch:
      case Value.kTop:
      case Value.kUppercase:
      case Value.kVisible:
      case Value.kWrap:
      case Value.kWrapReverse:
        NOTREACHED();
    }
  }
}

export function GetUsedLeftIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/visuren.html#position-props
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.left.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedRightIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/visuren.html#position-props
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.right.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedTopIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to height of containing block.
  //   https://www.w3.org/TR/CSS21/visuren.html#position-props
  let used_length_provider = new UsedLengthProvider(containing_block_size.height());
  computed_style.top.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedBottomIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to height of containing block.
  //   https://www.w3.org/TR/CSS21/visuren.html#position-props
  let used_length_provider = new UsedLengthProvider(containing_block_size.height());
  computed_style.bottom.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedBorderLeft(computed_style: ComputedStyleData): LayoutUnit {
  return new LayoutUnit(GetUsedNonNegativeLength(computed_style.border_left_width));
}

export function GetUsedBorderTop(computed_style: ComputedStyleData): LayoutUnit {
  return new LayoutUnit((computed_style.border_top_width as LengthValue).value());
}

export function GetUsedBorderRight(computed_style: ComputedStyleData): LayoutUnit {
  return new LayoutUnit((computed_style.border_right_width as LengthValue).value());
}

export function GetUsedBorderBottom(computed_style: ComputedStyleData): LayoutUnit {
  return new LayoutUnit((computed_style.border_bottom_width as LengthValue).value());
}

export function GetUsedPaddingLeft(computed_style: ComputedStyleData,
                                   containing_block_size: SizeLayoutUnit): LayoutUnit {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#padding-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.padding_left.Accept(used_length_provider);
  return used_length_provider.used_length()!;
}

export function GetUsedPaddingTop(computed_style: ComputedStyleData,
                                  containing_block_size: SizeLayoutUnit): LayoutUnit {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#padding-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.padding_top.Accept(used_length_provider);
  return used_length_provider.used_length()!;
}

export function GetUsedPaddingRight(computed_style: ComputedStyleData,
                                    containing_block_size: SizeLayoutUnit): LayoutUnit {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#padding-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.padding_right.Accept(used_length_provider);
  return used_length_provider.used_length()!;
}

export function GetUsedPaddingBottom(computed_style: ComputedStyleData,
                                     containing_block_size: SizeLayoutUnit): LayoutUnit {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#padding-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.padding_bottom.Accept(used_length_provider);
  return used_length_provider.used_length()!;
}

export function GetUsedColor(color_refptr: PropertyValue): ColorRGBA {
  let color: RGBAColorValue = color_refptr as RGBAColorValue;
  return new ColorRGBA(color.value());
}

// A percentage for the horizontal offset is relative to the width of the
// bounding box. A percentage for the vertical offset is relative to height of
// the bounding box. A length value gives a fixed length as the offset.
// The value for the horizontal and vertical offset represent an offset from the
// top left corner of the bounding box.
//  https://www.w3.org/TR/css3-transforms/#transform-origin-property
export function GetTransformOrigin(used_rect: RectF, value: PropertyValue): Vector2dF {
  let property_list = value as PropertyListValue;

  DCHECK_EQ(property_list.value().length, 3);
  let horizontal = property_list.value()[0] as CalcValue;

  let x_within_border_box =
    horizontal.percentage_value().value() * used_rect.width() +
    horizontal.length_value().value();

  let vertical = property_list.value()[1] as CalcValue;
  let y_within_border_box =
    vertical.percentage_value().value() * used_rect.height() +
    vertical.length_value().value();

  return new Vector2dF(used_rect.x() + x_within_border_box,
    used_rect.y() + y_within_border_box);
}

export function GetUsedNonNegativeLength(length_refptr: PropertyValue): LayoutUnit {
  let length = length_refptr as LengthValue;
  DCHECK_EQ(length.unit(), LengthUnit.kPixelsUnit);
  let layout_unit = new LayoutUnit(length.value());
  if (layout_unit.LT(new LayoutUnit())) {
    DLOG(WARNING, 'Invalid non-negative layout length ',
      layout_unit.toFloat(), ', original length was ',
      length.value());
    layout_unit = new LayoutUnit();
  }
  return layout_unit;
}

export interface IDependsOnContainingBlockHolder {
  depends_on_containing_block: boolean
}

export function GetUsedHeightIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit,
  valueHolder: Optional<Partial<IDependsOnContainingBlockHolder>> = undefined): Optional<LayoutUnit> {
  // The percentage is calculated with respect to the height of the generated
  // box's containing block.
  //   https://www.w3.org/TR/CSS21/visudet.html#the-height-property
  let used_length_provider = new UsedLengthProvider(containing_block_size.height());
  computed_style.height.Accept(used_length_provider);
  if (!!valueHolder) {
    valueHolder.depends_on_containing_block =
      used_length_provider.depends_on_containing_block();
  }
  return used_length_provider.used_length();
}

export function GetUsedMarginTopIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#margin-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.margin_top.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedMarginBottomIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#margin-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.margin_bottom.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedWidthIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit,
  valueHolder: Optional<Partial<IDependsOnContainingBlockHolder>> = undefined): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/visudet.html#the-width-property
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.width.Accept(used_length_provider);
  if (valueHolder) {
    valueHolder.depends_on_containing_block = used_length_provider.depends_on_containing_block();
  }
  return used_length_provider.used_length();
}

export function GetUsedMarginLeftIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#margin-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.margin_left.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedMarginRightIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/box.html#margin-properties
  let used_length_provider = new UsedLengthProvider(containing_block_size.width());
  computed_style.margin_right.Accept(used_length_provider);
  return used_length_provider.used_length();
}

class UsedMaxLengthProvider extends UsedLengthValueProvider {

  constructor(percentage_base: LayoutUnit) {
    super(percentage_base);
  }

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kNone:
        this.depends_on_containing_block_ = true;

        // Leave |used_length_| in disengaged state to indicate that "none"
        // was the value.
        break;

      case Value.kAbsolute:
      case Value.kAlternate:
      case Value.kAlternateReverse:
      case Value.kAuto:
      case Value.kBackwards:
      case Value.kBaseline:
      case Value.kBlock:
      case Value.kBoth:
      case Value.kBottom:
      case Value.kBreakWord:
      case Value.kCenter:
      case Value.kClip:
      case Value.kCollapse:
      case Value.kColumn:
      case Value.kColumnReverse:
      case Value.kContain:
      case Value.kContent:
      case Value.kCover:
      case Value.kCurrentColor:
      case Value.kCursive:
      case Value.kEllipsis:
      case Value.kEnd:
      case Value.kEquirectangular:
      case Value.kFantasy:
      case Value.kFixed:
      case Value.kFlex:
      case Value.kFlexEnd:
      case Value.kFlexStart:
      case Value.kForwards:
      case Value.kHidden:
      case Value.kInfinite:
      case Value.kInherit:
      case Value.kInitial:
      case Value.kInline:
      case Value.kInlineBlock:
      case Value.kInlineFlex:
      case Value.kLeft:
      case Value.kLineThrough:
      case Value.kMiddle:
      case Value.kMonoscopic:
      case Value.kMonospace:
      case Value.kNoRepeat:
      case Value.kNormal:
      case Value.kNowrap:
      case Value.kPre:
      case Value.kPreLine:
      case Value.kPreWrap:
      case Value.kRelative:
      case Value.kRepeat:
      case Value.kReverse:
      case Value.kRight:
      case Value.kRow:
      case Value.kRowReverse:
      case Value.kSansSerif:
      case Value.kScroll:
      case Value.kSerif:
      case Value.kSolid:
      case Value.kSpaceAround:
      case Value.kSpaceBetween:
      case Value.kStart:
      case Value.kStatic:
      case Value.kStereoscopicLeftRight:
      case Value.kStereoscopicTopBottom:
      case Value.kStretch:
      case Value.kTop:
      case Value.kUppercase:
      case Value.kVisible:
      case Value.kWrap:
      case Value.kWrapReverse:
        NOTREACHED();
    }
  }
}

export function GetUsedMaxWidthIfNotNone(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit,
  holder: Optional<Partial<IDependsOnContainingBlockHolder>> = undefined): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/visudet.html#propdef-max-width
  let used_length_provider = new UsedMaxLengthProvider(containing_block_size.width());
  computed_style.max_width.Accept(used_length_provider);
  if (holder) {
    holder.depends_on_containing_block = used_length_provider.depends_on_containing_block();
  }
  return used_length_provider.used_length()
}

class UsedMinLengthProvider extends UsedLengthValueProvider {
  constructor(percentage_base: LayoutUnit) {
    super(percentage_base);
  }

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
        this.depends_on_containing_block_ = false;
        // Leave |used_length_| in disengaged state to indicate that "auto"
        // was the value.
        break;

      case Value.kAbsolute:
      case Value.kAlternate:
      case Value.kAlternateReverse:
      case Value.kBackwards:
      case Value.kBaseline:
      case Value.kBlock:
      case Value.kBoth:
      case Value.kBottom:
      case Value.kBreakWord:
      case Value.kCenter:
      case Value.kClip:
      case Value.kCollapse:
      case Value.kColumn:
      case Value.kColumnReverse:
      case Value.kContain:
      case Value.kContent:
      case Value.kCover:
      case Value.kCurrentColor:
      case Value.kCursive:
      case Value.kEllipsis:
      case Value.kEnd:
      case Value.kEquirectangular:
      case Value.kFantasy:
      case Value.kFixed:
      case Value.kFlex:
      case Value.kFlexEnd:
      case Value.kFlexStart:
      case Value.kForwards:
      case Value.kHidden:
      case Value.kInfinite:
      case Value.kInherit:
      case Value.kInitial:
      case Value.kInline:
      case Value.kInlineBlock:
      case Value.kInlineFlex:
      case Value.kLeft:
      case Value.kLineThrough:
      case Value.kMiddle:
      case Value.kMonoscopic:
      case Value.kMonospace:
      case Value.kNone:
      case Value.kNoRepeat:
      case Value.kNormal:
      case Value.kNowrap:
      case Value.kPre:
      case Value.kPreLine:
      case Value.kPreWrap:
      case Value.kRelative:
      case Value.kRepeat:
      case Value.kReverse:
      case Value.kRight:
      case Value.kRow:
      case Value.kRowReverse:
      case Value.kSansSerif:
      case Value.kScroll:
      case Value.kSerif:
      case Value.kSolid:
      case Value.kSpaceAround:
      case Value.kSpaceBetween:
      case Value.kStart:
      case Value.kStatic:
      case Value.kStereoscopicLeftRight:
      case Value.kStereoscopicTopBottom:
      case Value.kStretch:
      case Value.kTop:
      case Value.kUppercase:
      case Value.kVisible:
      case Value.kWrap:
      case Value.kWrapReverse:
        NOTREACHED();
    }
  }
};

export function GetUsedMinWidthIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit,
  valueHolder: Optional<Partial<IDependsOnContainingBlockHolder>> = undefined): Optional<LayoutUnit> {
  // Percentages: refer to width of containing block.
  //   https://www.w3.org/TR/CSS21/visudet.html#propdef-min-width
  let used_length_provider = new UsedMinLengthProvider(containing_block_size.width());
  computed_style.min_width.Accept(used_length_provider);
  if (valueHolder) {
    valueHolder.depends_on_containing_block =
      used_length_provider.depends_on_containing_block();
  }
  return used_length_provider.used_length()
}

export function GetUsedMaxHeightIfNotNone(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to height of containing block.
  //   https://www.w3.org/TR/CSS21/visudet.html#propdef-max-height
  let used_length_provider = new UsedMaxLengthProvider(containing_block_size.height());
  computed_style.max_height.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedMinHeightIfNotAuto(
  computed_style: ComputedStyleData,
  containing_block_size: SizeLayoutUnit): Optional<LayoutUnit> {
  // Percentages: refer to height of containing block.
  //   https://www.w3.org/TR/CSS21/visudet.html#propdef-max-height
  let used_length_provider = new UsedMinLengthProvider(containing_block_size.height());
  computed_style.min_height.Accept(used_length_provider);
  return used_length_provider.used_length();
}

export function GetUsedLength(
  length_refptr: PropertyValue): LayoutUnit {
  let length = length_refptr as LengthValue;
  DCHECK_EQ(length.unit(), LengthUnit.kPixelsUnit);
  return new LayoutUnit(length.value());
}

function ConvertCSSOMFontValuesToRenderTreeFontStyle(style: FontStyleEnum, weight: FontWeightEnum): FontStyle {
  let font_weight = Weight.kNormalWeight;
  switch (weight) {
    case FontWeightEnum.kThinAka100:
      font_weight = Weight.kThinWeight;
      break;
    case FontWeightEnum.kExtraLightAka200:
      font_weight = Weight.kExtraLightWeight;
      break;
    case FontWeightEnum.kLightAka300:
      font_weight = Weight.kLightWeight;
      break;
    case FontWeightEnum.kNormalAka400:
      font_weight = Weight.kNormalWeight;
      break;
    case FontWeightEnum.kMediumAka500:
      font_weight = Weight.kMediumWeight;
      break;
    case FontWeightEnum.kSemiBoldAka600:
      font_weight = Weight.kSemiBoldWeight;
      break;
    case FontWeightEnum.kBoldAka700:
      font_weight = Weight.kBoldWeight;
      break;
    case FontWeightEnum.kExtraBoldAka800:
      font_weight = Weight.kExtraBoldWeight;
      break;
    case FontWeightEnum.kBlackAka900:
      font_weight = Weight.kBlackWeight;
      break;
  }

  let font_slant =
    style == FontStyleEnum.kItalic
      ? Slant.kItalicSlant
      : Slant.kUprightSlant;

  return new FontStyle(font_weight, font_slant);
}

export class UsedLineHeightProvider extends NotReachedPropertyValueVisitor {

  private font_metrics_: FontMetrics;
  private font_size_: PropertyValue;

  private used_line_height_ = new LayoutUnit();
  private half_leading_ = new LayoutUnit();
  constructor(
    font_metrics: FontMetrics,
    font_size: PropertyValue
  ) {
    super();
    this.font_metrics_ = font_metrics;
    this.font_size_ = font_size;
  }

  VisitKeyword(keyword: KeywordValue) {
    DCHECK_EQ(Value.kNormal, keyword.value());
    this.used_line_height_ = new LayoutUnit(this.font_metrics_.em_box_height());
    this.UpdateHalfLeading();
  }
  VisitLength(length: LengthValue) {
    DCHECK_EQ(LengthUnit.kPixelsUnit, length.unit());
    this.used_line_height_ = new LayoutUnit(length.value());
    this.UpdateHalfLeading();
  }
  VisitNumber(length: NumberValue) {
    let font_size = GetFontSize(this.font_size_);
    // The used value of the property is this number multiplied by the element's
    // font size.
    //   https://www.w3.org/TR/CSS21/visudet.html#line-height
    this.used_line_height_ = new LayoutUnit(length.value() * font_size);
    this.UpdateHalfLeading();
  }

  used_line_height() {
    return this.used_line_height_;
  }
  half_leading() {
    return this.half_leading_;
  }

  // Half the leading is added above ascent (A) and the other half below
  // descent (D), giving the glyph and its leading (L) a total height above
  // the baseline of A' = A + L/2 and a total depth of D' = D + L/2.
  //   https://www.w3.org/TR/CSS21/visudet.html#leading
  baseline_offset_from_top() {
    return (new LayoutUnit(this.font_metrics_.ascent())).ADD(this.half_leading_);
  }
  baseline_offset_from_bottom() {
    return (new LayoutUnit(this.font_metrics_.descent()).ADD(this.half_leading_));
  }

// private:
  private UpdateHalfLeading() {
    // Determine the leading L, where L = "line-height" - AD,
    // AD = A (ascent) + D (descent).
    //   https://www.w3.org/TR/CSS21/visudet.html#leading
    this.half_leading_ = (this.used_line_height_.SUB(new LayoutUnit(this.font_metrics_.ascent() +
      this.font_metrics_.descent()))).DIV(2);
  }
};
