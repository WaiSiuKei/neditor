import { DCHECK_GE, DCHECK_GT, DCHECK_LE, DCHECK_LT } from '@neditor/core/base/check_op';
import type { PropertyValue } from './property_value';
import { DCHECK } from '@neditor/core/base/check';
import { KeywordValue } from './keyword_value';
import { RGBAColorValue } from './rgba_color_value';
import { PropertyListValue, PropertyListValueBuilder } from './property_list_value';
import { CalcValue } from './calc_value';
import { PercentageValue } from './percentage_value';
import { LengthUnit, LengthValue } from './length_value';
import { NumberValue } from './number_value';
import { StringValue } from './string_value';
import { FontStyleValue } from './font_style_value';
import { FontWeightValue } from './font_weight_value';
import { IntegerValue } from './integer_value';
import { UnicodeRangeValue } from './unicode_range_value';
import { NOTIMPLEMENTED } from '@neditor/core/base/common/notreached';
import { LowerCaseEqualsASCII } from '@neditor/core/base/common/strings';

export enum PropertyKey {
  kNoneProperty = -1,

  // All supported longhand properties are listed here.
  kAlignContentProperty,
  kAlignItemsProperty,
  kAlignSelfProperty,
  // kAnimationDelayProperty,
  // kAnimationDirectionProperty,
  // kAnimationDurationProperty,
  // kAnimationFillModeProperty,
  // kAnimationIterationCountProperty,
  // kAnimationNameProperty,
  // kAnimationTimingFunctionProperty,
  kBackgroundColorProperty,
  kBackgroundImageProperty,
  kBackgroundPositionProperty,
  kBackgroundRepeatProperty,
  kBackgroundSizeProperty,
  kBorderBottomColorProperty,
  kBorderBottomLeftRadiusProperty,
  kBorderBottomRightRadiusProperty,
  kBorderBottomStyleProperty,
  kBorderBottomWidthProperty,
  kBorderLeftColorProperty,
  kBorderLeftStyleProperty,
  kBorderLeftWidthProperty,
  kBorderRightColorProperty,
  kBorderRightStyleProperty,
  kBorderRightWidthProperty,
  kBorderTopColorProperty,
  kBorderTopLeftRadiusProperty,
  kBorderTopRightRadiusProperty,
  kBorderTopStyleProperty,
  kBorderTopWidthProperty,
  kBottomProperty,
  kBoxShadowProperty,
  kColorProperty,
  kContentProperty,
  kDisplayProperty,
  kFilterProperty,
  kFlexBasisProperty,
  kFlexDirectionProperty,
  kFlexGrowProperty,
  kFlexShrinkProperty,
  kFlexWrapProperty,
  kFontFamilyProperty,
  kFontSizeProperty,
  kFontStyleProperty,
  kFontWeightProperty,
  kHeightProperty,
  kIntersectionObserverRootMarginProperty,
  kJustifyContentProperty,
  kLeftProperty,
  kLineHeightProperty,
  kMarginBottomProperty,
  kMarginLeftProperty,
  kMarginRightProperty,
  kMarginTopProperty,
  kMaxHeightProperty,
  kMaxWidthProperty,
  kMinHeightProperty,
  kMinWidthProperty,
  kOpacityProperty,
  kOrderProperty,
  kOutlineColorProperty,
  kOutlineStyleProperty,
  kOutlineWidthProperty,
  kOverflowProperty,
  kOverflowWrapProperty,
  kPaddingBottomProperty,
  kPaddingLeftProperty,
  kPaddingRightProperty,
  kPaddingTopProperty,
  kPointerEventsProperty,
  kPositionProperty,
  kRightProperty,
  kTextAlignProperty,
  kTextDecorationColorProperty,
  kTextDecorationLineProperty,
  kTextIndentProperty,
  kTextOverflowProperty,
  kTextPathProperty,
  kTextShadowProperty,
  kTextTransformProperty,
  kTopProperty,
  kTransformOriginProperty,
  kTransformProperty,
  // kTransitionDelayProperty,
  // kTransitionDurationProperty,
  // kTransitionPropertyProperty,
  // kTransitionTimingFunctionProperty,
  kVerticalAlignProperty,
  kVisibilityProperty,
  kWhiteSpaceProperty,
  kWidthProperty,
  kZIndexProperty,
  kMaxLonghandPropertyKey = kZIndexProperty,

  // All other supported properties, such as shorthand properties or
  // aliases are listed here.
  kAllProperty,
  kSrcProperty,           // property for @font-face at-rule
  kUnicodeRangeProperty,  // property for @font-face at-rule
  kWordWrapProperty,      // alias for kOverflowWrap

  // Shorthand properties
  kFirstShorthandPropertyKey,
  // kAnimationProperty = kFirstShorthandPropertyKey,
  kBackgroundProperty = kFirstShorthandPropertyKey,
  kBorderBottomProperty,
  kBorderColorProperty,
  kBorderLeftProperty,
  kBorderProperty,
  kBorderRadiusProperty,
  kBorderRightProperty,
  kBorderStyleProperty,
  kBorderTopProperty,
  kBorderWidthProperty,
  kFlexProperty,
  kFlexFlowProperty,
  kFontProperty,
  kMarginProperty,
  kOutlineProperty,
  kPaddingProperty,
  kTextDecorationProperty,
  // kTransitionProperty,
  kMaxShorthandPropertyKey = kTextDecorationProperty,
  // kMaxShorthandPropertyKey = kTransitionProperty,

  kMaxEveryPropertyKey = kMaxShorthandPropertyKey,
  kNumLonghandProperties = kMaxLonghandPropertyKey + 1,
}

export enum Inherited {
  kInheritedNo,
  kInheritedYes,
}

export enum Animatable {
  kAnimatableNo,
  kAnimatableYes,
};

// Any property that is referenced when calculating the computed property values
// of children should have this set to true.
// NOTE: This currently occurs within
// CalculateComputedStyleContext::HandleSpecifiedValue.
export enum ImpactsChildComputedStyle {
  kImpactsChildComputedStyleNo,
  kImpactsChildComputedStyleYes,
};

// Any property that is referenced during box generation should have this set to
// true.
// NOTE: This currently occurs within BoxGenerator.
export enum ImpactsBoxGeneration {
  kImpactsBoxGenerationNo,
  kImpactsBoxGenerationYes,
};

// Any property that is referenced when updating the size of boxes should have
// this set to true.
// NOTE: This currently occurs within Box::UpdateSize().
export enum ImpactsBoxSizes {
  kImpactsBoxSizesNo,
  kImpactsBoxSizesYes,
};

// Any property that is referenced when generating cross references should have
// this set to true.
// NOTE: This currently occurs within ContainerBox::UpdateCrossReferences().
export enum ImpactsBoxCrossReferences {
  kImpactsBoxCrossReferencesNo,
  kImpactsBoxCrossReferencesYes,
};

export type LonghandPropertySet = Set<PropertyKey>

class PropertyDefinition {
  name: string = '';
  inherited: Inherited = Inherited.kInheritedNo;
  animatable: Animatable = Animatable.kAnimatableNo;
  impacts_child_computed_style = ImpactsChildComputedStyle.kImpactsChildComputedStyleNo;
  impacts_box_generation = ImpactsBoxGeneration.kImpactsBoxGenerationNo;
  impacts_box_sizes = ImpactsBoxSizes.kImpactsBoxSizesNo;
  impacts_box_cross_references = ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo;
  initial_value?: PropertyValue;
  longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
  constructor(initial_value?: PropertyValue) {
    this.initial_value = initial_value;
  }

}

class NonTrivialGlobalVariables {
  properties: PropertyDefinition[] = [];
  animatable_properties: PropertyKey[] = [];
  inherited_animatable_properties: PropertyKey[] = [];
  inherited_properties: PropertyKey[] = [];

  SetPropertyDefinition(
    key: PropertyKey,
    name: string,
    inherited: Inherited,
    animatable: Animatable,
    impacts_child_computed_style: ImpactsChildComputedStyle,
    impacts_box_generation: ImpactsBoxGeneration,
    impacts_box_sizes: ImpactsBoxSizes,
    impacts_box_cross_references: ImpactsBoxCrossReferences,
    initial_value?: PropertyValue) {
    DCHECK_LT(PropertyKey.kNoneProperty, key);
    let prev = this.properties[key];
    DCHECK(!prev?.name, 'Properties can only be defined once.');
    let definition = new PropertyDefinition(initial_value);
    definition.name = name;
    definition.inherited = inherited;
    definition.animatable = animatable;
    definition.impacts_child_computed_style = impacts_child_computed_style;
    definition.impacts_box_generation = impacts_box_generation;
    definition.impacts_box_sizes = impacts_box_sizes;
    definition.impacts_box_cross_references = impacts_box_cross_references;
    this.properties[key] = definition;
  }

  SetShorthandPropertyDefinition(
    key: PropertyKey,
    name: string,
    longhand_properties: LonghandPropertySet) {
    DCHECK_LE(PropertyKey.kFirstShorthandPropertyKey, key);
    DCHECK_GE(PropertyKey.kMaxShorthandPropertyKey, key);
    let prev = this.properties[key];
    DCHECK(!prev?.name, 'Properties can only be defined once.');
    let definition = new PropertyDefinition();
    definition.name = name;
    definition.longhand_properties = longhand_properties;
    this.properties[key] = definition;
  }

  constructor() {
// https://www.w3.org/TR/css-flexbox-1/#align-content-property
    this.SetPropertyDefinition(PropertyKey.kAlignContentProperty, 'align-content', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetStretch());

    // https://www.w3.org/TR/css-flexbox-1/#align-items-property
    this.SetPropertyDefinition(PropertyKey.kAlignItemsProperty, 'align-items', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetStretch());

    // https://www.w3.org/TR/css-flexbox-1/#propdef-align-self
    this.SetPropertyDefinition(PropertyKey.kAlignSelfProperty, 'align-self', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetAuto());

    // https://www.w3.org/TR/css3-background/#the-background-color
    this.SetPropertyDefinition(PropertyKey.kBackgroundColorProperty, 'background-color',
      Inherited.kInheritedNo, Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new RGBAColorValue(0x00000000));

    // https://www.w3.org/TR/css3-background/#background-image
    this.SetPropertyDefinition(PropertyKey.kBackgroundImageProperty, 'background-image', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      CreateSinglePropertyListWithValue(KeywordValue.GetNone()));

    // https://www.w3.org/TR/css3-background/#the-background-position
    let background_position_builder: PropertyListValueBuilder = new Array(2);
    background_position_builder.push(new CalcValue(new PercentageValue(0.0)));
    background_position_builder.push(new CalcValue(new PercentageValue(0.0)));
    let background_position_list = new PropertyListValue(background_position_builder);
    this.SetPropertyDefinition(PropertyKey.kBackgroundPositionProperty, 'background-position',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      background_position_list);

    // The first value is for the horizontal direction, and the second for the
    // vertical one. If only one 'repeat' is given, the second is assumed to be
    // 'repeat'.
    //   https://www.w3.org/TR/css3-background/#the-background-repeat
    let background_repeat_builder: PropertyListValueBuilder = new Array(2);
    background_repeat_builder.push(KeywordValue.GetRepeat());
    background_repeat_builder.push(KeywordValue.GetRepeat());
    let background_repeat_list = new PropertyListValue(background_repeat_builder);
    this.SetPropertyDefinition(PropertyKey.kBackgroundRepeatProperty, 'background-repeat', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, background_repeat_list);

    // The first value gives the width of the corresponding image, and the second
    // value gives its height. If only one value is given, the second is assumed
    // to be 'auto'.
    //   https://www.w3.org/TR/css-backgrounds-3/#the-background-size
    let background_size_builder: PropertyListValueBuilder = new Array(2);
    background_size_builder.push(KeywordValue.GetAuto());
    background_size_builder.push(KeywordValue.GetAuto());
    let background_size_list = new PropertyListValue(background_size_builder);
    this.SetPropertyDefinition(PropertyKey.kBackgroundSizeProperty, 'background-size', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, background_size_list);

    // This sets the foreground color of the border specified by the border-style
    // property.
    //   https://www.w3.org/TR/css3-background/#border-color
    this.SetPropertyDefinition(PropertyKey.kBorderTopColorProperty, 'border-top-color', Inherited.kInheritedNo, Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetCurrentColor());

    this.SetPropertyDefinition(PropertyKey.kBorderRightColorProperty, 'border-right-color',
      Inherited.kInheritedNo, Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetCurrentColor());

    this.SetPropertyDefinition(PropertyKey.kBorderBottomColorProperty, 'border-bottom-color',
      Inherited.kInheritedNo, Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetCurrentColor());

    this.SetPropertyDefinition(PropertyKey.kBorderLeftColorProperty, 'border-left-color',
      Inherited.kInheritedNo, Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetCurrentColor());

    // https://www.w3.org/TR/css3-background/#border-style
    this.SetPropertyDefinition(PropertyKey.kBorderTopStyleProperty, 'border-top-style',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNone());

    this.SetPropertyDefinition(PropertyKey.kBorderRightStyleProperty, 'border-right-style',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNone());

    this.SetPropertyDefinition(PropertyKey.kBorderBottomStyleProperty, 'border-bottom-style',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNone());

    this.SetPropertyDefinition(PropertyKey.kBorderLeftStyleProperty, 'border-left-style',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNone());

    //  Initial: medium.
    // According to the spec., make the thickness depend on the 'medium' font
    // size: one choice might be 1, 3, & 5px (thin, medium, and thick) when the
    // 'medium' font size is 17 px or less.
    //   https://www.w3.org/TR/css3-background/#border-width
    this.SetPropertyDefinition(PropertyKey.kBorderTopWidthProperty, 'border-top-width',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(3, LengthUnit.kPixelsUnit));

    this.SetPropertyDefinition(PropertyKey.kBorderRightWidthProperty, 'border-right-width',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(3, LengthUnit.kPixelsUnit));

    this.SetPropertyDefinition(PropertyKey.kBorderBottomWidthProperty, 'border-bottom-width',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(3, LengthUnit.kPixelsUnit));

    this.SetPropertyDefinition(PropertyKey.kBorderLeftWidthProperty, 'border-left-width',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(3, LengthUnit.kPixelsUnit));

    //   https://www.w3.org/TR/css3-background/#the-border-radius
    this.SetPropertyDefinition(PropertyKey.kBorderTopLeftRadiusProperty, 'border-top-left-radius',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    this.SetPropertyDefinition(PropertyKey.kBorderTopRightRadiusProperty,
      'border-top-right-radius', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    this.SetPropertyDefinition(PropertyKey.kBorderBottomRightRadiusProperty, 'border-bottom-right-radius',
      Inherited.kInheritedNo, Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    this.SetPropertyDefinition(PropertyKey.kBorderBottomLeftRadiusProperty, 'border-bottom-left-radius',
      Inherited.kInheritedNo, Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS2/visuren.html#propdef-bottom
    this.SetPropertyDefinition(PropertyKey.kBottomProperty, 'bottom', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleYes, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetAuto());

    // https://www.w3.org/TR/css3-background/#the-box-shadow
    this.SetPropertyDefinition(PropertyKey.kBoxShadowProperty, 'box-shadow', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetNone());

    // Opaque black in Chromium and Cobalt.
    //   https://www.w3.org/TR/css3-color/#foreground
    this.SetPropertyDefinition(
      PropertyKey.kColorProperty,
      'color', Inherited.kInheritedYes,
      Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleYes,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes,
      ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new RGBAColorValue(0x000000ff));

    // https://www.w3.org/TR/CSS21/generate.html#content
    this.SetPropertyDefinition(PropertyKey.kContentProperty, 'content', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNormal());

    // https://www.w3.org/TR/CSS21/visuren.html#display-prop
    // FIXME: 改了默认值
    this.SetPropertyDefinition(PropertyKey.kDisplayProperty, 'display', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetBlock());

    // https://www.w3.org/TR/filter-effects-1/#FilterProperty
    this.SetPropertyDefinition(PropertyKey.kFilterProperty, 'filter', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNone());

    // https://www.w3.org/TR/css-flexbox-1/#flex-basis-property
    this.SetPropertyDefinition(PropertyKey.kFlexBasisProperty, 'flex-basis', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetAuto());

    // https://www.w3.org/TR/css-flexbox-1/#flex-direction-property
    this.SetPropertyDefinition(PropertyKey.kFlexDirectionProperty, 'flex-direction', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetRow());

    // https://www.w3.org/TR/css-flexbox-1/#flex-grow-property
    this.SetPropertyDefinition(PropertyKey.kFlexGrowProperty, 'flex-grow', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, new NumberValue(0));

    // https://www.w3.org/TR/css-flexbox-1/#flex-shrink-property
    this.SetPropertyDefinition(PropertyKey.kFlexShrinkProperty, 'flex-shrink', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, new NumberValue(1));

    // https://www.w3.org/TR/css-flexbox-1/#flex-wrap-property
    this.SetPropertyDefinition(PropertyKey.kFlexWrapProperty, 'flex-wrap', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNowrap());

    // Varies by platform in Chromium, Roboto in Cobalt.
    //   https://www.w3.org/TR/css3-fonts/#font-family-prop
    this.SetPropertyDefinition(PropertyKey.kFontFamilyProperty, 'font-family', Inherited.kInheritedYes, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationYes,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      CreateSinglePropertyListWithValue(new StringValue('Noto Mono')));

    // "medium" translates to 16px in Chromium.
    // Cobalt does not support keyword sizes, so we simply hardcode 16px.
    //   https://www.w3.org/TR/css3-fonts/#font-size-prop
    this.SetPropertyDefinition(PropertyKey.kFontSizeProperty, 'font-size', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleYes,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(16, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/css3-fonts/#font-style-prop
    this.SetPropertyDefinition(PropertyKey.kFontStyleProperty, 'font-style', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      FontStyleValue.GetNormal());

    // https://www.w3.org/TR/css3-fonts/#font-weight-prop
    this.SetPropertyDefinition(PropertyKey.kFontWeightProperty, 'font-weight', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      FontWeightValue.GetNormalAka400());

    // https://www.w3.org/TR/CSS21/visudet.html#the-height-property
    this.SetPropertyDefinition(PropertyKey.kHeightProperty, 'height', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleYes, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetAuto());

    // https://www.w3.org/TR/intersection-observer/#parse-a-root-margin
    // Not actually a new CSS property but we need it to parse an
    // IntersectionObserver's root margin
    this.SetPropertyDefinition(PropertyKey.kIntersectionObserverRootMarginProperty,
      'intersection-observer-root-margin', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetAuto());

    // https://www.w3.org/TR/css-flexbox-1/#justify-content-property
    this.SetPropertyDefinition(PropertyKey.kJustifyContentProperty, 'justify-content',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetFlexStart());

    // https://www.w3.org/TR/CSS2/visuren.html#propdef-left
    this.SetPropertyDefinition(PropertyKey.kLeftProperty, 'left', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetAuto());

    // https://www.w3.org/TR/CSS21/visudet.html#line-height
    this.SetPropertyDefinition(PropertyKey.kLineHeightProperty, 'line-height', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNormal());

    // https://www.w3.org/TR/CSS21/box.html#margin-properties
    this.SetPropertyDefinition(PropertyKey.kMarginBottomProperty, 'margin-bottom', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS21/box.html#margin-properties
    this.SetPropertyDefinition(PropertyKey.kMarginLeftProperty, 'margin-left', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS21/box.html#margin-properties
    this.SetPropertyDefinition(PropertyKey.kMarginRightProperty, 'margin-right', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS21/box.html#margin-properties
    this.SetPropertyDefinition(PropertyKey.kMarginTopProperty, 'margin-top', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS2/visudet.html#propdef-max-height
    this.SetPropertyDefinition(PropertyKey.kMaxHeightProperty, 'max-height', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetNone());

    // https://www.w3.org/TR/CSS2/visudet.html#propdef-max-width
    this.SetPropertyDefinition(PropertyKey.kMaxWidthProperty, 'max-width', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetNone());

    // https://www.w3.org/TR/CSS2/visudet.html#propdef-min-height
    // https://www.w3.org/TR/css-sizing-3/#min-size-properties
    this.SetPropertyDefinition(PropertyKey.kMinHeightProperty, 'min-height', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetAuto());

    // https://www.w3.org/TR/CSS2/visudet.html#propdef-min-width
    // https://www.w3.org/TR/css-sizing-3/#min-size-properties
    this.SetPropertyDefinition(PropertyKey.kMinWidthProperty, 'min-width', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetAuto());

    // https://www.w3.org/TR/css3-color/#opacity
    this.SetPropertyDefinition(PropertyKey.kOpacityProperty, 'opacity', Inherited.kInheritedNo,
      Animatable.kAnimatableYes, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesYes, new NumberValue(1.0
      ));

    // https://www.w3.org/TR/css-flexbox-1/#order-property
    this.SetPropertyDefinition(PropertyKey.kOrderProperty, 'order', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new IntegerValue(0));

    // https://www.w3.org/TR/CSS21/ui.html#propdef-outline-color
    this.SetPropertyDefinition(PropertyKey.kOutlineColorProperty, 'outline-color', Inherited.kInheritedNo, Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetCurrentColor());

    // https://www.w3.org/TR/CSS21/ui.html#propdef-outline-style
    this.SetPropertyDefinition(PropertyKey.kOutlineStyleProperty, 'outline-style', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetNone());

    // https://www.w3.org/TR/CSS21/ui.html#propdef-outline-width
    this.SetPropertyDefinition(PropertyKey.kOutlineWidthProperty, 'outline-width', Inherited.kInheritedNo,
      Animatable.kAnimatableYes, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(3, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/css-overflow-3/#overflow-properties
    this.SetPropertyDefinition(PropertyKey.kOverflowProperty, 'overflow', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesYes,
      KeywordValue.GetVisible());

    // https://www.w3.org/TR/css-text-3/#overflow-wrap
    this.SetPropertyDefinition(PropertyKey.kOverflowWrapProperty, 'overflow-wrap', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNormal());

    // https://www.w3.org/TR/CSS21/box.html#padding-properties
    this.SetPropertyDefinition(PropertyKey.kPaddingBottomProperty, 'padding-bottom', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS21/box.html#padding-properties
    this.SetPropertyDefinition(PropertyKey.kPaddingLeftProperty, 'padding-left', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS21/box.html#padding-properties
    this.SetPropertyDefinition(PropertyKey.kPaddingRightProperty, 'padding-right', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/CSS21/box.html#padding-properties
    this.SetPropertyDefinition(PropertyKey.kPaddingTopProperty, 'padding-top', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // While only defined in the SVG spec, the pointer-events property has been
    // proposed an commonly implemented to also apply to HTML elements for
    // values of 'none' (element can not be indicated by a pointer) and 'auto'
    // (element can be indicated by a pointer if the element has 'visibility' set
    // to 'visible').
    //   https://www.w3.org/TR/SVG11/interact.html#PointerEventsProperty
    this.SetPropertyDefinition(PropertyKey.kPointerEventsProperty, 'pointer-events', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetAuto());

    // https://www.w3.org/TR/css3-positioning/#position-property
    this.SetPropertyDefinition(PropertyKey.kPositionProperty, 'position', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesYes,
      KeywordValue.GetStatic());

    // https://www.w3.org/TR/CSS2/visuren.html#propdef-right
    this.SetPropertyDefinition(PropertyKey.kRightProperty, 'right', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetAuto());

    //   https://www.w3.org/TR/css-text-3/#text-align-property
    this.SetPropertyDefinition(PropertyKey.kTextAlignProperty, 'text-align', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetStart());

    //   https://www.w3.org/TR/css-text-decor-3/#text-decoration-color
    this.SetPropertyDefinition(PropertyKey.kTextDecorationColorProperty, 'text-decoration-color',
      Inherited.kInheritedNo, Animatable.kAnimatableYes,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetCurrentColor());

    //   https://www.w3.org/TR/css-text-decor-3/#text-decoration-line
    this.SetPropertyDefinition(PropertyKey.kTextDecorationLineProperty, 'text-decoration-line',
      Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNone());

    // https://www.w3.org/TR/CSS21/text.html#propdef-text-indent
    this.SetPropertyDefinition(PropertyKey.kTextIndentProperty, 'text-indent', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      new LengthValue(0, LengthUnit.kPixelsUnit));

    // https://www.w3.org/TR/css3-ui/#propdef-text-overflow
    this.SetPropertyDefinition(PropertyKey.kTextOverflowProperty, 'text-overflow', Inherited.kInheritedNo,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetClip());

    // 自定义的 textPath 属性
    this.SetPropertyDefinition(
      PropertyKey.kTextPathProperty,
      'text-path',
      Inherited.kInheritedYes,
      Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNone()
    );

    // https://www.w3.org/TR/css-text-decor-3/#text-shadow-property
    this.SetPropertyDefinition(PropertyKey.kTextShadowProperty, 'text-shadow', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetNone());

    // https://www.w3.org/TR/css3-text/#text-transform-property
    this.SetPropertyDefinition(PropertyKey.kTextTransformProperty, 'text-transform', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetNone());

    // https://www.w3.org/TR/CSS2/visuren.html#propdef-top
    this.SetPropertyDefinition(PropertyKey.kTopProperty, 'top', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleYes, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetAuto());

    // https://www.w3.org/TR/css3-transforms/#transform-property
    this.SetPropertyDefinition(PropertyKey.kTransformProperty, 'transform', Inherited.kInheritedNo,
      Animatable.kAnimatableYes, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesYes, KeywordValue.GetNone());

    // https://www.w3.org/TR/css3-transforms/#propdef-transform-origin
    let transform_origin_builder: PropertyListValueBuilder = new Array(3);
    transform_origin_builder.push(new CalcValue(new PercentageValue(0.5)));

    transform_origin_builder.push(new CalcValue(new PercentageValue(0.5)));

    transform_origin_builder.push(new LengthValue(0.0, LengthUnit.kPixelsUnit));

    let transform_origin_list = new PropertyListValue(transform_origin_builder);
    this.SetPropertyDefinition(PropertyKey.kTransformOriginProperty, 'transform-origin', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, transform_origin_list);

    // https://www.w3.org/TR/CSS21/visudet.html#propdef-vertical-align
    this.SetPropertyDefinition(PropertyKey.kVerticalAlignProperty, 'vertical-align', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetBaseline());

    // https://www.w3.org/TR/CSS21/visufx.html#propdef-visibility
    this.SetPropertyDefinition(PropertyKey.kVisibilityProperty, 'visibility', Inherited.kInheritedYes, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, KeywordValue.GetVisible());

    // https://www.w3.org/TR/css3-text/#white-space-property
    this.SetPropertyDefinition(PropertyKey.kWhiteSpaceProperty, 'white-space', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationYes, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNormal());

    // https://www.w3.org/TR/CSS21/visudet.html#the-width-property
    this.SetPropertyDefinition(PropertyKey.kWidthProperty, 'width', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleYes, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesYes, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetAuto());

    // https://www.w3.org/TR/CSS21/visuren.html#z-index
    this.SetPropertyDefinition(PropertyKey.kZIndexProperty, 'z-index', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesYes,
      KeywordValue.GetAuto());

    // This property name can appear as a keyword for the transition-property
    // property.
    //   https://www.w3.org/TR/2013/WD-css3-transitions-20131119/#transition-property-property
    this.SetPropertyDefinition(PropertyKey.kAllProperty, 'all', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo);

    // This is a descriptor for @font-face at-rules.
    //   https://www.w3.org/TR/css3-fonts/#descdef-src
    this.SetPropertyDefinition(PropertyKey.kSrcProperty, 'src', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo,
      ImpactsBoxSizes.kImpactsBoxSizesNo, ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo);

    //   https://www.w3.org/TR/css3-fonts/#unicode-range-desc
    this.SetPropertyDefinition(PropertyKey.kUnicodeRangeProperty, 'unicode-range', Inherited.kInheritedNo, Animatable.kAnimatableNo,
      ImpactsChildComputedStyle.kImpactsChildComputedStyleNo, ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesNo,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo, new UnicodeRangeValue(0, 0x10FFFF));

    // This is an alias for kOverflowWrap
    //   https://www.w3.org/TR/css-text-3/#overflow-wrap
    this.SetPropertyDefinition(PropertyKey.kWordWrapProperty, 'word-wrap', Inherited.kInheritedYes,
      Animatable.kAnimatableNo, ImpactsChildComputedStyle.kImpactsChildComputedStyleNo,
      ImpactsBoxGeneration.kImpactsBoxGenerationNo, ImpactsBoxSizes.kImpactsBoxSizesYes,
      ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesNo,
      KeywordValue.GetNormal());

    // Shorthand properties.

    //   https://www.w3.org/TR/css3-background/#the-background
    let background_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    background_longhand_properties.add(PropertyKey.kBackgroundColorProperty);
    background_longhand_properties.add(PropertyKey.kBackgroundImageProperty);
    background_longhand_properties.add(PropertyKey.kBackgroundPositionProperty);
    background_longhand_properties.add(PropertyKey.kBackgroundRepeatProperty);
    background_longhand_properties.add(PropertyKey.kBackgroundSizeProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBackgroundProperty, 'background',
      background_longhand_properties);

    //    https://www.w3.org/TR/css3-background/#border-color
    let border_color_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_color_longhand_properties.add(PropertyKey.kBorderTopColorProperty);
    border_color_longhand_properties.add(PropertyKey.kBorderRightColorProperty);
    border_color_longhand_properties.add(PropertyKey.kBorderBottomColorProperty);
    border_color_longhand_properties.add(PropertyKey.kBorderLeftColorProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderColorProperty, 'border-color',
      border_color_longhand_properties);

    //    https://www.w3.org/TR/css3-background/#border-style
    let border_style_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_style_longhand_properties.add(PropertyKey.kBorderTopStyleProperty);
    border_style_longhand_properties.add(PropertyKey.kBorderRightStyleProperty);
    border_style_longhand_properties.add(PropertyKey.kBorderBottomStyleProperty);
    border_style_longhand_properties.add(PropertyKey.kBorderLeftStyleProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderStyleProperty, 'border-style',
      border_style_longhand_properties);

    //   https://www.w3.org/TR/css3-background/#border-width
    let border_width_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_width_longhand_properties.add(PropertyKey.kBorderTopWidthProperty);
    border_width_longhand_properties.add(PropertyKey.kBorderRightWidthProperty);
    border_width_longhand_properties.add(PropertyKey.kBorderBottomWidthProperty);
    border_width_longhand_properties.add(PropertyKey.kBorderLeftWidthProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderWidthProperty, 'border-width',
      border_width_longhand_properties);

    //   https://www.w3.org/TR/css3-background/#border-radius
    let border_radius_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_radius_longhand_properties.add(PropertyKey.kBorderTopLeftRadiusProperty);
    border_radius_longhand_properties.add(PropertyKey.kBorderTopRightRadiusProperty);
    border_radius_longhand_properties.add(PropertyKey.kBorderBottomRightRadiusProperty);
    border_radius_longhand_properties.add(PropertyKey.kBorderBottomLeftRadiusProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderRadiusProperty, 'border-radius',
      border_radius_longhand_properties);

    //   https://www.w3.org/TR/css-backgrounds-3/#propdef-border
    let border_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_longhand_properties.add(PropertyKey.kBorderColorProperty);
    border_longhand_properties.add(PropertyKey.kBorderStyleProperty);
    border_longhand_properties.add(PropertyKey.kBorderWidthProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderProperty, 'border',
      border_longhand_properties);

    // Border shorthand properties.
    //  https://www.w3.org/TR/css-backgrounds-3/#the-border-shorthands
    let border_top_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_top_longhand_properties.add(PropertyKey.kBorderTopColorProperty);
    border_top_longhand_properties.add(PropertyKey.kBorderTopStyleProperty);
    border_top_longhand_properties.add(PropertyKey.kBorderTopWidthProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderTopProperty, 'border-top',
      border_top_longhand_properties);

    let border_right_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_right_longhand_properties.add(PropertyKey.kBorderRightColorProperty);
    border_right_longhand_properties.add(PropertyKey.kBorderRightStyleProperty);
    border_right_longhand_properties.add(PropertyKey.kBorderRightWidthProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderRightProperty, 'border-right',
      border_right_longhand_properties);

    let border_bottom_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_bottom_longhand_properties.add(PropertyKey.kBorderBottomColorProperty);
    border_bottom_longhand_properties.add(PropertyKey.kBorderBottomStyleProperty);
    border_bottom_longhand_properties.add(PropertyKey.kBorderBottomWidthProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderBottomProperty, 'border-bottom',
      border_bottom_longhand_properties);

    let border_left_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    border_left_longhand_properties.add(PropertyKey.kBorderLeftColorProperty);
    border_left_longhand_properties.add(PropertyKey.kBorderLeftStyleProperty);
    border_left_longhand_properties.add(PropertyKey.kBorderLeftWidthProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kBorderLeftProperty, 'border-left',
      border_left_longhand_properties);

    // https://www.w3.org/TR/css-flexbox-1/#flex-property
    let flex_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    flex_longhand_properties.add(PropertyKey.kFlexGrowProperty);
    flex_longhand_properties.add(PropertyKey.kFlexShrinkProperty);
    flex_longhand_properties.add(PropertyKey.kFlexBasisProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kFlexProperty, 'flex',
      flex_longhand_properties);

    // https://www.w3.org/TR/css-flexbox-1/#flex-flow-property
    let flex_flow_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    flex_flow_longhand_properties.add(PropertyKey.kFlexDirectionProperty);
    flex_flow_longhand_properties.add(PropertyKey.kFlexWrapProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kFlexFlowProperty, 'flex-flow',
      flex_flow_longhand_properties);

    //   https://www.w3.org/TR/css3-fonts/#font-prop
    let font_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    font_longhand_properties.add(PropertyKey.kFontStyleProperty);
    font_longhand_properties.add(PropertyKey.kFontWeightProperty);
    font_longhand_properties.add(PropertyKey.kFontSizeProperty);
    font_longhand_properties.add(PropertyKey.kFontFamilyProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kFontProperty, 'font',
      font_longhand_properties);

    //   https://www.w3.org/TR/CSS21/box.html#propdef-margin
    let margin_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    margin_longhand_properties.add(PropertyKey.kMarginBottomProperty);
    margin_longhand_properties.add(PropertyKey.kMarginLeftProperty);
    margin_longhand_properties.add(PropertyKey.kMarginRightProperty);
    margin_longhand_properties.add(PropertyKey.kMarginTopProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kMarginProperty, 'margin',
      margin_longhand_properties);

    //   https://www.w3.org/TR/CSS21/ui.html#propdef-outline
    let outline_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    outline_longhand_properties.add(PropertyKey.kOutlineColorProperty);
    outline_longhand_properties.add(PropertyKey.kOutlineStyleProperty);
    outline_longhand_properties.add(PropertyKey.kOutlineWidthProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kOutlineProperty, 'outline',
      outline_longhand_properties);

    //   https://www.w3.org/TR/CSS21/box.html#propdef-padding
    let padding_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    padding_longhand_properties.add(PropertyKey.kPaddingBottomProperty);
    padding_longhand_properties.add(PropertyKey.kPaddingLeftProperty);
    padding_longhand_properties.add(PropertyKey.kPaddingRightProperty);
    padding_longhand_properties.add(PropertyKey.kPaddingTopProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kPaddingProperty, 'padding',
      padding_longhand_properties);

    //   https://www.w3.org/TR/css-text-decor-3/#text-decoration
    let text_decoration_longhand_properties: LonghandPropertySet = new Set<PropertyKey>();
    text_decoration_longhand_properties.add(PropertyKey.kTextDecorationColorProperty);
    text_decoration_longhand_properties.add(PropertyKey.kTextDecorationLineProperty);
    this.SetShorthandPropertyDefinition(PropertyKey.kTextDecorationProperty, 'text-decoration',
      text_decoration_longhand_properties);

    this.CompileSetOfAnimatableProperties();
  }

  CompileSetOfAnimatableProperties() {
    for (let i = 0; i < PropertyKey.kMaxEveryPropertyKey + 1; ++i) {
      if (this.properties[i].animatable == Animatable.kAnimatableYes) {
        this.animatable_properties.push(i);
        if (this.properties[i].inherited == Inherited.kInheritedYes) {
          this.inherited_animatable_properties.push(i);
        }
      }
      if (this.properties[i].inherited === Inherited.kInheritedYes) {
        this.inherited_properties.push(i);
      }
    }
  }

  CompileSortedLonghandProperties() {
    NOTIMPLEMENTED();
    // When serializing the CSS Declaration block returned by getComputedStyle,
    // all supported longhand CSS Properties must be listed in lexicographical
    // order. This prepares the lexicographical_longhand_keys array to contain
    // PropertyKeys in lexicographical order. See
    // https://www.w3.org/TR/2013/WD-cssom-20131205/#dom-window-getcomputedstyle.
  }
}

const non_trivial_global_variables = new NonTrivialGlobalVariables();

export function GetPropertyName(key: PropertyKey): string {
  DCHECK_GT(key, PropertyKey.kNoneProperty);
  DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
  return non_trivial_global_variables.properties[key].name;
}

export function GetPropertyInheritance(key: PropertyKey): Inherited {
  DCHECK(!IsShorthandProperty(key));
  DCHECK_GT(key, PropertyKey.kNoneProperty);
  DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
  return non_trivial_global_variables.properties[key].inherited;
}

function IsShorthandProperty(key: PropertyKey): boolean {
  return key >= PropertyKey.kFirstShorthandPropertyKey && key <= PropertyKey.kMaxShorthandPropertyKey;
}

export function GetPropertyInitialValue(key: PropertyKey): PropertyValue {
  DCHECK(!IsShorthandProperty(key));
  DCHECK_GT(key, PropertyKey.kNoneProperty);
  DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
  return non_trivial_global_variables.properties[key]!.initial_value!;
}

export function GetInheritedAnimatableProperties(): PropertyKey[] {
  return non_trivial_global_variables.inherited_animatable_properties.slice();
}

export function GetInheritedProperties(): PropertyKey[] {
  return non_trivial_global_variables.inherited_properties.slice();
}

export function GetPropertyImpactsChildComputedStyle(
  key: PropertyKey): ImpactsChildComputedStyle {
  DCHECK(!IsShorthandProperty(key));
  DCHECK_GT(key, PropertyKey.kNoneProperty);
  DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
  return non_trivial_global_variables
    .properties[key]
    .impacts_child_computed_style;
}

export function GetPropertyImpactsBoxGeneration(key: PropertyKey): ImpactsBoxGeneration {
  DCHECK(!IsShorthandProperty(key));
  DCHECK_GT(key, PropertyKey.kNoneProperty);
  DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
  return non_trivial_global_variables
    .properties[key]
    .impacts_box_generation;
}

export function GetPropertyImpactsBoxSizes(key: PropertyKey): ImpactsBoxSizes {
  DCHECK(!IsShorthandProperty(key));
  DCHECK_GT(key, PropertyKey.kNoneProperty);
  DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
  return non_trivial_global_variables
    .properties[key]
    .impacts_box_sizes;
}

export function GetPropertyImpactsBoxCrossReferences(
  key: PropertyKey): ImpactsBoxCrossReferences {
  DCHECK(!IsShorthandProperty(key));
  DCHECK_GT(key, PropertyKey.kNoneProperty);
  DCHECK_LE(key, PropertyKey.kMaxEveryPropertyKey);
  return non_trivial_global_variables
    .properties[key]
    .impacts_box_cross_references;
}

// Returns a PropertyListValue with only the single specified value.
function CreateSinglePropertyListWithValue(value: PropertyValue): PropertyListValue {
  return new PropertyListValue([value]);
}

export function GetPropertyKey(property_name: string): PropertyKey {
  switch (property_name.length) {
    case 3:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTopProperty))) {
        return PropertyKey.kTopProperty;
      }
      return PropertyKey.kNoneProperty;

    case 4:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFlexProperty))) {
        return PropertyKey.kFlexProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFontProperty))) {
        return PropertyKey.kFontProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kLeftProperty))) {
        return PropertyKey.kLeftProperty;
      }
      return PropertyKey.kNoneProperty;

    case 5:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kColorProperty))) {
        return PropertyKey.kColorProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOrderProperty))) {
        return PropertyKey.kOrderProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kRightProperty))) {
        return PropertyKey.kRightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kWidthProperty))) {
        return PropertyKey.kWidthProperty;
      }
      return PropertyKey.kNoneProperty;

    case 6:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderProperty))) {
        return PropertyKey.kBorderProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBottomProperty))) {
        return PropertyKey.kBottomProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFilterProperty))) {
        return PropertyKey.kFilterProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kHeightProperty))) {
        return PropertyKey.kHeightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMarginProperty))) {
        return PropertyKey.kMarginProperty;
      }
      return PropertyKey.kNoneProperty;

    case 7:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kContentProperty))) {
        return PropertyKey.kContentProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kDisplayProperty))) {
        return PropertyKey.kDisplayProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOpacityProperty))) {
        return PropertyKey.kOpacityProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOutlineProperty))) {
        return PropertyKey.kOutlineProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kPaddingProperty))) {
        return PropertyKey.kPaddingProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kZIndexProperty))) {
        return PropertyKey.kZIndexProperty;
      }
      return PropertyKey.kNoneProperty;

    case 8:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOverflowProperty))) {
        return PropertyKey.kOverflowProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kPositionProperty))) {
        return PropertyKey.kPositionProperty;
      }
      return PropertyKey.kNoneProperty;

    case 9:
      // if (LowerCaseEqualsASCII(property_name,
      //   GetPropertyName(PropertyKey.kAnimationProperty))) {
      //   return PropertyKey.kAnimationProperty;
      // }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFlexFlowProperty))) {
        return PropertyKey.kFlexFlowProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFlexGrowProperty))) {
        return PropertyKey.kFlexGrowProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFlexWrapProperty))) {
        return PropertyKey.kFlexWrapProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFontSizeProperty))) {
        return PropertyKey.kFontSizeProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMaxWidthProperty))) {
        return PropertyKey.kMaxWidthProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMinWidthProperty))) {
        return PropertyKey.kMinWidthProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTextPathProperty))) {
        return PropertyKey.kTextPathProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTransformProperty))) {
        return PropertyKey.kTransformProperty;
      }
      return PropertyKey.kNoneProperty;

    case 10:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kAlignSelfProperty))) {
        return PropertyKey.kAlignSelfProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBackgroundProperty))) {
        return PropertyKey.kBackgroundProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderTopProperty))) {
        return PropertyKey.kBorderTopProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBoxShadowProperty))) {
        return PropertyKey.kBoxShadowProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFlexBasisProperty))) {
        return PropertyKey.kFlexBasisProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFontStyleProperty))) {
        return PropertyKey.kFontStyleProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMarginTopProperty))) {
        return PropertyKey.kMarginTopProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMaxHeightProperty))) {
        return PropertyKey.kMaxHeightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMinHeightProperty))) {
        return PropertyKey.kMinHeightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTextAlignProperty))) {
        return PropertyKey.kTextAlignProperty;
      }
      // if (LowerCaseEqualsASCII(property_name,
      //   GetPropertyName(PropertyKey.kTransitionProperty))) {
      //   return PropertyKey.kTransitionProperty;
      // }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kVisibilityProperty))) {
        return PropertyKey.kVisibilityProperty;
      }
      return PropertyKey.kNoneProperty;

    case 11:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kAlignItemsProperty))) {
        return PropertyKey.kAlignItemsProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderLeftProperty))) {
        return PropertyKey.kBorderLeftProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFlexShrinkProperty))) {
        return PropertyKey.kFlexShrinkProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFontFamilyProperty))) {
        return PropertyKey.kFontFamilyProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFontWeightProperty))) {
        return PropertyKey.kFontWeightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kLineHeightProperty))) {
        return PropertyKey.kLineHeightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMarginLeftProperty))) {
        return PropertyKey.kMarginLeftProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kPaddingTopProperty))) {
        return PropertyKey.kPaddingTopProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTextIndentProperty))) {
        return PropertyKey.kTextIndentProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTextShadowProperty))) {
        return PropertyKey.kTextShadowProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kWhiteSpaceProperty))) {
        return PropertyKey.kWhiteSpaceProperty;
      }
      return PropertyKey.kNoneProperty;

    case 12:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderColorProperty))) {
        return PropertyKey.kBorderColorProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderRightProperty))) {
        return PropertyKey.kBorderRightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderStyleProperty))) {
        return PropertyKey.kBorderStyleProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderWidthProperty))) {
        return PropertyKey.kBorderWidthProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMarginRightProperty))) {
        return PropertyKey.kMarginRightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kPaddingLeftProperty))) {
        return PropertyKey.kPaddingLeftProperty;
      }
      return PropertyKey.kNoneProperty;

    case 13:
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kAlignContentProperty))) {
        return PropertyKey.kAlignContentProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderBottomProperty))) {
        return PropertyKey.kBorderBottomProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kBorderRadiusProperty))) {
        return PropertyKey.kBorderRadiusProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kMarginBottomProperty))) {
        return PropertyKey.kMarginBottomProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOutlineColorProperty))) {
        return PropertyKey.kOutlineColorProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOutlineStyleProperty))) {
        return PropertyKey.kOutlineStyleProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOutlineWidthProperty))) {
        return PropertyKey.kOutlineWidthProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kOverflowWrapProperty))) {
        return PropertyKey.kOverflowWrapProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kPaddingRightProperty))) {
        return PropertyKey.kPaddingRightProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTextOverflowProperty))) {
        return PropertyKey.kTextOverflowProperty;
      }
      return PropertyKey.kNoneProperty;

    case 14:
      // if (LowerCaseEqualsASCII(property_name,
      //   GetPropertyName(PropertyKey.kAnimationNameProperty))) {
      //   return PropertyKey.kAnimationNameProperty;
      // }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kFlexDirectionProperty))) {
        return PropertyKey.kFlexDirectionProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kPaddingBottomProperty))) {
        return PropertyKey.kPaddingBottomProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kPointerEventsProperty))) {
        return PropertyKey.kPointerEventsProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kTextTransformProperty))) {
        return PropertyKey.kTextTransformProperty;
      }
      if (LowerCaseEqualsASCII(property_name,
        GetPropertyName(PropertyKey.kVerticalAlignProperty))) {
        return PropertyKey.kVerticalAlignProperty;
      }
      return PropertyKey.kNoneProperty;

    case 15:
      // if (LowerCaseEqualsASCII(
      //   property_name, GetPropertyName(PropertyKey.kAnimationDelayProperty))) {
      //   return PropertyKey.kAnimationDelayProperty;
      // }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBackgroundSizeProperty))) {
        return PropertyKey.kBackgroundSizeProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kJustifyContentProperty))) {
        return PropertyKey.kJustifyContentProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kTextDecorationProperty))) {
        return PropertyKey.kTextDecorationProperty;
      }
      return PropertyKey.kNoneProperty;

    case 16:
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBackgroundColorProperty))) {
        return PropertyKey.kBackgroundColorProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderTopColorProperty))) {
        return PropertyKey.kBorderTopColorProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderTopStyleProperty))) {
        return PropertyKey.kBorderTopStyleProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderTopWidthProperty))) {
        return PropertyKey.kBorderTopWidthProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBackgroundImageProperty))) {
        return PropertyKey.kBackgroundImageProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kTransformOriginProperty))) {
        return PropertyKey.kTransformOriginProperty;
      }
      // if (LowerCaseEqualsASCII(
      //   property_name, GetPropertyName(PropertyKey.kTransitionDelayProperty))) {
      //   return PropertyKey.kTransitionDelayProperty;
      // }
      return PropertyKey.kNoneProperty;

    case 17:
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBackgroundRepeatProperty))) {
        return PropertyKey.kBackgroundRepeatProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderLeftColorProperty))) {
        return PropertyKey.kBorderLeftColorProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderLeftStyleProperty))) {
        return PropertyKey.kBorderLeftStyleProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderLeftWidthProperty))) {
        return PropertyKey.kBorderLeftWidthProperty;
      }
      return PropertyKey.kNoneProperty;

    case 18:
      // if (LowerCaseEqualsASCII(
      //   property_name, GetPropertyName(PropertyKey.kAnimationDurationProperty))) {
      //   return PropertyKey.kAnimationDurationProperty;
      // }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderRightColorProperty))) {
        return PropertyKey.kBorderRightColorProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderRightStyleProperty))) {
        return PropertyKey.kBorderRightStyleProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderRightWidthProperty))) {
        return PropertyKey.kBorderRightWidthProperty;
      }
      return PropertyKey.kNoneProperty;

    case 19:
      // if (LowerCaseEqualsASCII(
      //   property_name, GetPropertyName(PropertyKey.kAnimationDirectionProperty))) {
      //   return PropertyKey.kAnimationDirectionProperty;
      // }
      // if (LowerCaseEqualsASCII(
      //   property_name, GetPropertyName(PropertyKey.kAnimationFillModeProperty))) {
      //   return PropertyKey.kAnimationFillModeProperty;
      // }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBackgroundPositionProperty))) {
        return PropertyKey.kBackgroundPositionProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderBottomColorProperty))) {
        return PropertyKey.kBorderBottomColorProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderBottomStyleProperty))) {
        return PropertyKey.kBorderBottomStyleProperty;
      }
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderBottomWidthProperty))) {
        return PropertyKey.kBorderBottomWidthProperty;
      }
      // if (LowerCaseEqualsASCII(
      //   property_name, GetPropertyName(PropertyKey.kTransitionDurationProperty))) {
      //   return PropertyKey.kTransitionDurationProperty;
      // }
      // if (LowerCaseEqualsASCII(
      //   property_name, GetPropertyName(PropertyKey.kTransitionPropertyProperty))) {
      //   return PropertyKey.kTransitionPropertyProperty;
      // }
      return PropertyKey.kNoneProperty;

    case 20:
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kTextDecorationLineProperty))) {
        return PropertyKey.kTextDecorationLineProperty;
      }
      return PropertyKey.kNoneProperty;

    case 21:
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kTextDecorationColorProperty))) {
        return PropertyKey.kTextDecorationColorProperty;
      }
      return PropertyKey.kNoneProperty;

    case 22:
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderTopLeftRadiusProperty))) {
        return PropertyKey.kBorderTopLeftRadiusProperty;
      }
      return PropertyKey.kNoneProperty;

    case 23:
      if (LowerCaseEqualsASCII(
        property_name, GetPropertyName(PropertyKey.kBorderTopRightRadiusProperty))) {
        return PropertyKey.kBorderTopRightRadiusProperty;
      }
      return PropertyKey.kNoneProperty;

    case 25:
      // if (LowerCaseEqualsASCII(
      //   property_name,
      //   GetPropertyName(PropertyKey.kAnimationIterationCountProperty))) {
      //   return PropertyKey.kAnimationIterationCountProperty;
      // }
      // if (LowerCaseEqualsASCII(
      //   property_name,
      //   GetPropertyName(PropertyKey.kAnimationTimingFunctionProperty))) {
      //   return PropertyKey.kAnimationTimingFunctionProperty;
      // }
      // if (LowerCaseEqualsASCII(
      //   property_name,
      //   GetPropertyName(PropertyKey.kBorderBottomLeftRadiusProperty))) {
      //   return PropertyKey.kBorderBottomLeftRadiusProperty;
      // }
      return PropertyKey.kNoneProperty;

    case 26:
      if (LowerCaseEqualsASCII(
        property_name,
        GetPropertyName(PropertyKey.kBorderBottomRightRadiusProperty))) {
        return PropertyKey.kBorderBottomRightRadiusProperty;
      }
      // if (LowerCaseEqualsASCII(
      //   property_name,
      //   GetPropertyName(PropertyKey.kTransitionTimingFunctionProperty))) {
      //   return PropertyKey.kTransitionTimingFunctionProperty;
      // }
      return PropertyKey.kNoneProperty;

    case 33:
      if (LowerCaseEqualsASCII(
        property_name,
        GetPropertyName(PropertyKey.kIntersectionObserverRootMarginProperty))) {
        return PropertyKey.kIntersectionObserverRootMarginProperty;
      }
      return PropertyKey.kNoneProperty;

    default:
      return PropertyKey.kNoneProperty;
  }
}
