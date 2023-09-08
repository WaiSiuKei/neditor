import type { PropertyValue } from './property_value';
import { GetPropertyInheritance, GetPropertyInitialValue, Inherited, PropertyKey } from './property_definitions';
import { DCHECK_EQ, DCHECK_GT, DCHECK_LE } from '@neditor/core/base/check_op';
import { PropertyValues } from './declaration_data';
import type { ComputedStyleDeclaration } from './computed_style_declaration';
import { KeywordValue } from './keyword_value';
import { DCHECK } from '@neditor/core/base/check';
import { keys } from '@neditor/core/base/common/objects';

export class ComputedStyleData {
  declared_property_values_: PropertyValues = new Map<PropertyKey, PropertyValue>();
  // True if this style has any inherited properties declared.
  // NOTE: Inherited properties that are set to a value "inherit" do not impact
  // this flag, as they will have the same value as the parent and can be
  // skipped by descendants retrieving their inherited value without impacting
  // the returned value.
  has_declared_inherited_properties_: boolean = false;
  // The parent used for inherited properties.
  // NOTE: The parent is a CSSComputedStyleDeclaration, rather than a
  // CSSComputedStyleData, in order to allow for the replacement of ancestor
  // CSSComputedStyleData objects without requiring all of its descendants to
  // also be replaced. The descendant's inherited property value will instead
  // dynamically update.
  parent_computed_style_declaration_: ComputedStyleDeclaration | null = null;
  // Stores whether the outer display type is inline before blockification.
  protected is_inline_before_blockification_: boolean = true;
  // Properties that were initially set to a value of "inherit" before being
  // updated with the parent's value. This is used to determine whether the
  // declared properties inherited from the parent have subsequently changed.
  declared_properties_inherited_from_parent_: PropertyKey[] = [];

  GetPropertyValueReference(key: PropertyKey): PropertyValue {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);

    // If the property's value is explicitly declared, then simply return it.
    if (this.declared_property_values_.has(key)) {
      return this.declared_property_values_.get(key)!;
    }

    // Otherwise, if the property is inherited and the parent has inherited
    // properties, then retrieve the parent's value for the property.
    if (this.parent_computed_style_declaration_ &&
      GetPropertyInheritance(key) === Inherited.kInheritedYes &&
      this.parent_computed_style_declaration_.HasInheritedProperties()) {
      return this.parent_computed_style_declaration_
        .GetInheritedPropertyValueReference(key);
    }

    // For the root element, which has no parent element, the inherited value is
    // the initial value of the property.
    //   https://www.w3.org/TR/css-cascade-3/#inheriting
    return this.GetComputedInitialValue(key);
  }

  GetComputedInitialValue(key: PropertyKey): PropertyValue {
    switch (key) {
      // case PropertyKey.kBorderTopColorProperty:
      // case PropertyKey.kBorderRightColorProperty:
      // case PropertyKey.kBorderBottomColorProperty:
      // case PropertyKey.kBorderLeftColorProperty:
      // case PropertyKey.kOutlineColorProperty:
      // case PropertyKey.kTextDecorationColorProperty:
      //   // Note that border color and text decoration color are not inherited.
      //   // The initial value of border color is 'currentColor' which means the
      //   // border color is the same as the value of the 'color' property.
      //   //    https://www.w3.org/TR/css3-color/#currentcolor
      //   return color();

      // case PropertyKey.kBorderTopWidthProperty:
      // case PropertyKey.kBorderRightWidthProperty:
      // case PropertyKey.kBorderBottomWidthProperty:
      // case PropertyKey.kBorderLeftWidthProperty:
      // case PropertyKey.kOutlineWidthProperty:
      //   // If the border style is 'none' or 'hidden', border width would be 0.
      //   //   https://www.w3.org/TR/css3-background/#border-width
      //   if (IsBorderStyleNoneOrHiddenForAnEdge(key)) {
      //     return non_trivial_static_fields.Get().zero_length_value;
      //   }
      //   break;

      case PropertyKey.kAllProperty:
      case PropertyKey.kAlignContentProperty:
      case PropertyKey.kAlignItemsProperty:
      case PropertyKey.kAlignSelfProperty:
      // case PropertyKey.kAnimationDelayProperty:
      // case PropertyKey.kAnimationDirectionProperty:
      // case PropertyKey.kAnimationDurationProperty:
      // case PropertyKey.kAnimationFillModeProperty:
      // case PropertyKey.kAnimationIterationCountProperty:
      // case PropertyKey.kAnimationNameProperty:
      // case PropertyKey.kAnimationProperty:
      // case PropertyKey.kAnimationTimingFunctionProperty:
      case PropertyKey.kBackgroundColorProperty:
      case PropertyKey.kBackgroundImageProperty:
      case PropertyKey.kBackgroundPositionProperty:
      case PropertyKey.kBackgroundProperty:
      case PropertyKey.kBackgroundRepeatProperty:
      case PropertyKey.kBackgroundSizeProperty:
      case PropertyKey.kBorderBottomLeftRadiusProperty:
      case PropertyKey.kBorderBottomProperty:
      case PropertyKey.kBorderBottomRightRadiusProperty:
      case PropertyKey.kBorderBottomStyleProperty:
      case PropertyKey.kBorderColorProperty:
      case PropertyKey.kBorderLeftProperty:
      case PropertyKey.kBorderLeftStyleProperty:
      case PropertyKey.kBorderProperty:
      case PropertyKey.kBorderRadiusProperty:
      case PropertyKey.kBorderRightProperty:
      case PropertyKey.kBorderRightStyleProperty:
      case PropertyKey.kBorderStyleProperty:
      case PropertyKey.kBorderTopLeftRadiusProperty:
      case PropertyKey.kBorderTopProperty:
      case PropertyKey.kBorderTopRightRadiusProperty:
      case PropertyKey.kBorderTopStyleProperty:
      case PropertyKey.kBorderWidthProperty:
      case PropertyKey.kBottomProperty:
      case PropertyKey.kBoxShadowProperty:
      case PropertyKey.kColorProperty:
      case PropertyKey.kContentProperty:
      case PropertyKey.kDisplayProperty:
      case PropertyKey.kFilterProperty:
      case PropertyKey.kFlexProperty:
      case PropertyKey.kFlexBasisProperty:
      case PropertyKey.kFlexDirectionProperty:
      case PropertyKey.kFlexFlowProperty:
      case PropertyKey.kFlexGrowProperty:
      case PropertyKey.kFlexShrinkProperty:
      case PropertyKey.kFlexWrapProperty:
      case PropertyKey.kFontProperty:
      case PropertyKey.kFontFamilyProperty:
      case PropertyKey.kFontStyleProperty:
      case PropertyKey.kFontWeightProperty:
      case PropertyKey.kFontSizeProperty:
      case PropertyKey.kHeightProperty:
      case PropertyKey.kIntersectionObserverRootMarginProperty:
      case PropertyKey.kJustifyContentProperty:
      case PropertyKey.kLeftProperty:
      case PropertyKey.kLineHeightProperty:
      case PropertyKey.kMarginBottomProperty:
      case PropertyKey.kMarginLeftProperty:
      case PropertyKey.kMarginProperty:
      case PropertyKey.kMarginRightProperty:
      case PropertyKey.kMarginTopProperty:
      case PropertyKey.kMaxHeightProperty:
      case PropertyKey.kMaxWidthProperty:
      case PropertyKey.kMinHeightProperty:
      case PropertyKey.kMinWidthProperty:
      case PropertyKey.kNoneProperty:
      case PropertyKey.kOpacityProperty:
      case PropertyKey.kOrderProperty:
      case PropertyKey.kOutlineProperty:
      case PropertyKey.kOutlineStyleProperty:
      case PropertyKey.kOverflowProperty:
      case PropertyKey.kOverflowWrapProperty:
      case PropertyKey.kPaddingBottomProperty:
      case PropertyKey.kPaddingLeftProperty:
      case PropertyKey.kPaddingProperty:
      case PropertyKey.kPaddingRightProperty:
      case PropertyKey.kPaddingTopProperty:
      case PropertyKey.kPointerEventsProperty:
      case PropertyKey.kPositionProperty:
      case PropertyKey.kRightProperty:
      case PropertyKey.kSrcProperty:
      case PropertyKey.kTextAlignProperty:
      case PropertyKey.kTextDecorationLineProperty:
      case PropertyKey.kTextDecorationProperty:
      case PropertyKey.kTextIndentProperty:
      case PropertyKey.kTextOverflowProperty:
      case PropertyKey.kTextPathProperty:
      case PropertyKey.kTextShadowProperty:
      case PropertyKey.kTextTransformProperty:
      case PropertyKey.kTopProperty:
      case PropertyKey.kTransformOriginProperty:
      case PropertyKey.kTransformProperty:
      // case PropertyKey.kTransitionDelayProperty:
      // case PropertyKey.kTransitionDurationProperty:
      // case PropertyKey.kTransitionProperty:
      // case PropertyKey.kTransitionPropertyProperty:
      // case PropertyKey.kTransitionTimingFunctionProperty:
      case PropertyKey.kUnicodeRangeProperty:
      case PropertyKey.kVerticalAlignProperty:
      case PropertyKey.kVisibilityProperty:
      case PropertyKey.kWhiteSpaceProperty:
      case PropertyKey.kWidthProperty:
      case PropertyKey.kWordWrapProperty:
      case PropertyKey.kZIndexProperty:
        break;
    }

    return GetPropertyInitialValue(key);
  }

  //#region attr

  get align_content() {
    return this.GetPropertyValueReference(PropertyKey.kAlignContentProperty);
  }

  get align_items() {
    return this.GetPropertyValueReference(PropertyKey.kAlignItemsProperty);
  }

  // get animation_delay() {
  //   return this.GetPropertyValueReference(PropertyKey.kAnimationDelayProperty);
  // }

  // get animation_direction() {
  //   return this.GetPropertyValueReference(PropertyKey.kAnimationDirectionProperty);
  // }

  // get animation_duration() {
  //   return this.GetPropertyValueReference(PropertyKey.kAnimationDurationProperty);
  // }

  // get animation_fill_mode() {
  //   return this.GetPropertyValueReference(PropertyKey.kAnimationFillModeProperty);
  // }

  // get animation_iteration_count() {
  //   return this.GetPropertyValueReference(PropertyKey.kAnimationIterationCountProperty);
  // }

  // get animation_name() {
  //   return this.GetPropertyValueReference(PropertyKey.kAnimationNameProperty);
  // }

  // get animation_timing_function() {
  //   return this.GetPropertyValueReference(PropertyKey.kAnimationTimingFunctionProperty);
  // }

  get background_color() {
    return this.GetPropertyValueReference(PropertyKey.kBackgroundColorProperty);
  }

  get background_image() {
    return this.GetPropertyValueReference(PropertyKey.kBackgroundImageProperty);
  }

  get background_position() {
    return this.GetPropertyValueReference(PropertyKey.kBackgroundPositionProperty);
  }

  get background_repeat() {
    return this.GetPropertyValueReference(PropertyKey.kBackgroundRepeatProperty);
  }

  get background_size() {
    return this.GetPropertyValueReference(PropertyKey.kBackgroundSizeProperty);
  }

  get border_top_color() {
    return this.GetPropertyValueReference(PropertyKey.kBorderTopColorProperty);
  }

  get border_right_color() {
    return this.GetPropertyValueReference(PropertyKey.kBorderRightColorProperty);
  }

  get border_bottom_color() {
    return this.GetPropertyValueReference(PropertyKey.kBorderBottomColorProperty);
  }

  get border_left_color() {
    return this.GetPropertyValueReference(PropertyKey.kBorderLeftColorProperty);
  }

  get border_top_style() {
    return this.GetPropertyValueReference(PropertyKey.kBorderTopStyleProperty);
  }

  get border_right_style() {
    return this.GetPropertyValueReference(PropertyKey.kBorderRightStyleProperty);
  }

  get border_bottom_style() {
    return this.GetPropertyValueReference(PropertyKey.kBorderBottomStyleProperty);
  }

  get border_left_style() {
    return this.GetPropertyValueReference(PropertyKey.kBorderLeftStyleProperty);
  }

  get border_top_width() {
    return this.GetPropertyValueReference(PropertyKey.kBorderTopWidthProperty);
  }

  get border_right_width() {
    return this.GetPropertyValueReference(PropertyKey.kBorderRightWidthProperty);
  }

  get border_bottom_width() {
    return this.GetPropertyValueReference(PropertyKey.kBorderBottomWidthProperty);
  }

  get border_left_width() {
    return this.GetPropertyValueReference(PropertyKey.kBorderLeftWidthProperty);
  }

  get border_top_left_radius() {
    return this.GetPropertyValueReference(PropertyKey.kBorderTopLeftRadiusProperty);
  }

  get border_top_right_radius() {
    return this.GetPropertyValueReference(PropertyKey.kBorderTopRightRadiusProperty);
  }

  get border_bottom_right_radius() {
    return this.GetPropertyValueReference(PropertyKey.kBorderBottomRightRadiusProperty);
  }

  get border_bottom_left_radius() {
    return this.GetPropertyValueReference(PropertyKey.kBorderBottomLeftRadiusProperty);
  }

  get bottom() {
    return this.GetPropertyValueReference(PropertyKey.kBottomProperty);
  }

  get box_shadow() {
    return this.GetPropertyValueReference(PropertyKey.kBoxShadowProperty);
  }

  get color() {
    return this.GetPropertyValueReference(PropertyKey.kColorProperty);
  }

  get content() {
    return this.GetPropertyValueReference(PropertyKey.kContentProperty);
  }

  get display() {
    return this.GetPropertyValueReference(PropertyKey.kDisplayProperty);
  }

  get filter() {
    return this.GetPropertyValueReference(PropertyKey.kFilterProperty);
  }

  get flex_basis() {
    return this.GetPropertyValueReference(PropertyKey.kFlexBasisProperty);
  }

  get flex_direction() {
    return this.GetPropertyValueReference(PropertyKey.kFlexDirectionProperty);
  }

  get flex_grow() {
    return this.GetPropertyValueReference(PropertyKey.kFlexGrowProperty);
  }

  get flex_shrink() {
    return this.GetPropertyValueReference(PropertyKey.kFlexShrinkProperty);
  }

  get flex_wrap() {
    return this.GetPropertyValueReference(PropertyKey.kFlexWrapProperty);
  }

  get font_family() {
    return this.GetPropertyValueReference(PropertyKey.kFontFamilyProperty);
  }

  get font_size() {
    return this.GetPropertyValueReference(PropertyKey.kFontSizeProperty);
  }

  get font_style() {
    return this.GetPropertyValueReference(PropertyKey.kFontStyleProperty);
  }

  get font_weight() {
    return this.GetPropertyValueReference(PropertyKey.kFontWeightProperty);
  }

  get height() {
    return this.GetPropertyValueReference(PropertyKey.kHeightProperty);
  }

  get justify_content() {
    return this.GetPropertyValueReference(PropertyKey.kJustifyContentProperty);
  }

  get left() {
    return this.GetPropertyValueReference(PropertyKey.kLeftProperty);
  }

  get line_height() {
    return this.GetPropertyValueReference(PropertyKey.kLineHeightProperty);
  }

  get margin_bottom() {
    return this.GetPropertyValueReference(PropertyKey.kMarginBottomProperty);
  }

  get margin_left() {
    return this.GetPropertyValueReference(PropertyKey.kMarginLeftProperty);
  }

  get margin_right() {
    return this.GetPropertyValueReference(PropertyKey.kMarginRightProperty);
  }

  get margin_top() {
    return this.GetPropertyValueReference(PropertyKey.kMarginTopProperty);
  }

  get max_height() {
    return this.GetPropertyValueReference(PropertyKey.kMaxHeightProperty);
  }

  get max_width() {
    return this.GetPropertyValueReference(PropertyKey.kMaxWidthProperty);
  }

  get min_height() {
    return this.GetPropertyValueReference(PropertyKey.kMinHeightProperty);
  }

  get min_width() {
    return this.GetPropertyValueReference(PropertyKey.kMinWidthProperty);
  }

  get opacity() {
    return this.GetPropertyValueReference(PropertyKey.kOpacityProperty);
  }

  get order() {
    return this.GetPropertyValueReference(PropertyKey.kOrderProperty);
  }

  get outline_color() {
    return this.GetPropertyValueReference(PropertyKey.kOutlineColorProperty);
  }

  get outline_style() {
    return this.GetPropertyValueReference(PropertyKey.kOutlineStyleProperty);
  }

  get outline_width() {
    return this.GetPropertyValueReference(PropertyKey.kOutlineWidthProperty);
  }

  get overflow() {
    return this.GetPropertyValueReference(PropertyKey.kOverflowProperty);
  }

  get overflow_wrap() {
    return this.GetPropertyValueReference(PropertyKey.kOverflowWrapProperty);
  }

  get padding_bottom() {
    return this.GetPropertyValueReference(PropertyKey.kPaddingBottomProperty);
  }

  get padding_left() {
    return this.GetPropertyValueReference(PropertyKey.kPaddingLeftProperty);
  }

  get padding_right() {
    return this.GetPropertyValueReference(PropertyKey.kPaddingRightProperty);
  }

  get padding_top() {
    return this.GetPropertyValueReference(PropertyKey.kPaddingTopProperty);
  }

  get pointer_events() {
    return this.GetPropertyValueReference(PropertyKey.kPointerEventsProperty);
  }

  get position() {
    return this.GetPropertyValueReference(PropertyKey.kPositionProperty);
  }

  get right() {
    return this.GetPropertyValueReference(PropertyKey.kRightProperty);
  }

  get text_align() {
    return this.GetPropertyValueReference(PropertyKey.kTextAlignProperty);
  }

  get text_decoration_color() {
    return this.GetPropertyValueReference(PropertyKey.kTextDecorationColorProperty);
  }

  get text_decoration_line() {
    return this.GetPropertyValueReference(PropertyKey.kTextDecorationLineProperty);
  }

  get text_indent() {
    return this.GetPropertyValueReference(PropertyKey.kTextIndentProperty);
  }

  get text_overflow() {
    return this.GetPropertyValueReference(PropertyKey.kTextOverflowProperty);
  }

  get text_path() {
    return this.GetPropertyValueReference(PropertyKey.kTextPathProperty);
  }

  get text_shadow() {
    return this.GetPropertyValueReference(PropertyKey.kTextShadowProperty);
  }

  get text_transform() {
    return this.GetPropertyValueReference(PropertyKey.kTextTransformProperty);
  }

  get top() {
    return this.GetPropertyValueReference(PropertyKey.kTopProperty);
  }

  get transform() {
    return this.GetPropertyValueReference(PropertyKey.kTransformProperty);
  }

  get transform_origin() {
    return this.GetPropertyValueReference(PropertyKey.kTransformOriginProperty);
  }

  // get transition_delay() {
  // return this.GetPropertyValueReference(PropertyKey.kTransitionDelayProperty);
  // }

  // get transition_duration() {
  //   return this.GetPropertyValueReference(PropertyKey.kTransitionDurationProperty);
  // }

  // get transition_property() {
  //   return this.GetPropertyValueReference(PropertyKey.kTransitionPropertyProperty);
  // }

  // get transition_timing_function() {
  //   return this.GetPropertyValueReference(PropertyKey.kTransitionTimingFunctionProperty);
  // }

  get vertical_align() {
    return this.GetPropertyValueReference(PropertyKey.kVerticalAlignProperty);
  }

  get visibility() {
    return this.GetPropertyValueReference(PropertyKey.kVisibilityProperty);
  }

  get white_space() {
    return this.GetPropertyValueReference(PropertyKey.kWhiteSpaceProperty);
  }

  get width() {
    return this.GetPropertyValueReference(PropertyKey.kWidthProperty);
  }

  get z_index() {
    return this.GetPropertyValueReference(PropertyKey.kZIndexProperty);
  }

//#endregion

  SetPropertyValue(key: PropertyKey, value?: PropertyValue) {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);

    if (value) {
      // this.declared_properties_.set(key, true);
      this.declared_property_values_.set(key, value);
      // Only set |has_declared_inherited_properties_| if the property is
      // inherited and the the value isn't explicitly set to "inherit". If it is
      // set to "inherit", then the value is simply a copy of the parent's value,
      // which doesn't necessitate the node being included in the inheritance
      // tree, as it doesn't provide new information.
      // NOTE: Declaring a value of "inherit" on an inherited property is used for
      // transitions, which need to know the original value of the property (which
      // would otherwise be lost when the parent changed).
      this.has_declared_inherited_properties_ =
        this.has_declared_inherited_properties_ ||
        (GetPropertyInheritance(key) == Inherited.kInheritedYes &&
          value != KeywordValue.GetInherit());
    } else if (this.declared_property_values_.has(key)) {
      this.declared_property_values_.delete(key);
    }
  }
  GetPropertyValue(key: PropertyKey): PropertyValue {
    return this.GetPropertyValueReference(key);
  }
  set_is_inline_before_blockification(value: boolean) {
    this.is_inline_before_blockification_ = value;
  }
  set_background_image(background_image: PropertyValue) {
    this.SetPropertyValue(PropertyKey.kBackgroundImageProperty, background_image);
  }
  // Whether or not any inherited properties have been declared.
  // NOTE: Inherited properties that are set to a value "inherit" do not impact
  // this flag, as they will have the same value as the parent and can be
  // skipped by descendants retrieving their inherited value without impacting
  // the returned value.
  has_declared_inherited_properties(): boolean {
    return this.has_declared_inherited_properties_;
  }

  GetParentComputedStyleDeclaration(): ComputedStyleDeclaration | null {
    return this.parent_computed_style_declaration_;
  }

  IsPositioned(): boolean {return this.position != KeywordValue.GetStatic();}
  IsTransformed(): boolean {return this.transform != KeywordValue.GetNone();}
  is_inline_before_blockification() {return this.is_inline_before_blockification_;}
  IsContainingBlockForPositionAbsoluteElements(): boolean {
    return this.IsPositioned() || this.IsTransformed();
  }
  //  // Returns true if the property is explicitly declared in this style, as
//  // opposed to implicitly inheriting from its parent or the initial value.
  IsDeclared(key: PropertyKey): boolean {
    return this.declared_property_values_.has(key);
  }
  declared_property_values(): PropertyValues {
    return this.declared_property_values_;
  }
  GetDeclaredPropertyValueReference(key: PropertyKey): PropertyValue {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);
    DCHECK(this.declared_property_values_.has(key));
    return this.declared_property_values_.get(key)!;
  }
  AddDeclaredPropertyInheritedFromParent(
    key: PropertyKey) {
    DCHECK_GT(key, PropertyKey.kNoneProperty);
    DCHECK_LE(key, PropertyKey.kMaxLonghandPropertyKey);
    this.declared_properties_inherited_from_parent_.push(key);
  }

  AreDeclaredPropertiesInheritedFromParentValid() {
    // If there are no declared properties inherited from the parent, then it's
    // impossible for them to be invalid.
    if (this.declared_properties_inherited_from_parent_.length == 0) {
      return true;
    }

    if (!this.parent_computed_style_declaration_) {
      return false;
    }

    let parent_computed_style_data =
      this.parent_computed_style_declaration_.data();
    if (!parent_computed_style_data) {
      return false;
    }

    // Verify that the parent's data is valid.
    DCHECK(parent_computed_style_data
      .AreDeclaredPropertiesInheritedFromParentValid());

    // Walk the declared properties inherited from the parent. They're invalid if
    // any no longer match the parent's value.
    for (let key of this.declared_properties_inherited_from_parent_) {
      if (this.GetPropertyValueReference(key) !== parent_computed_style_data.GetPropertyValueReference(key)) {
        return false;
      }
    }
    return true;
  }
  AssignFrom(rhs: ComputedStyleData) {
    // declared_properties_ = rhs.declared_properties_;
    this.declared_property_values_ = rhs.declared_property_values_;
    this.has_declared_inherited_properties_ = rhs.has_declared_inherited_properties_;
    this.declared_properties_inherited_from_parent_ =
      rhs.declared_properties_inherited_from_parent_;
    this.parent_computed_style_declaration_ = rhs.parent_computed_style_declaration_;
    this.is_inline_before_blockification_ = rhs.is_inline_before_blockification_;
  }

  DoDeclaredPropertiesMatch(
    other: ComputedStyleData): boolean {
    // If the bitsets don't match, then there's no need to check the values;
    // the declared properties are guaranteed to not match.
    // if (this.declared_properties_ != other.declared_properties_) {
    // return false;
    // }

    // Verify that the same number of declared property values exist within the
    // two CSSComputedStyleData objects. This should be guaranteed by the
    // bitsets matching.
    DCHECK_EQ(this.declared_property_values_.size, other.declared_property_values_.size);

    // Walk the two lists of declared property values looking for any keys or
    // values that don't match.
    for (let key of this.declared_property_values_.keys()) {
      if (this.declared_property_values_.get(key) !== other.declared_property_values_.get(key)) {
        return false;
      }
    }
    return true;
  }
}

export class MutableComputedStyleData extends ComputedStyleData {
  set_background_color(background_color: PropertyValue) {
    this.SetPropertyValue(PropertyKey.kBackgroundColorProperty, background_color);
  }
  set_display(display: PropertyValue) {
    this.SetPropertyValue(PropertyKey.kDisplayProperty, display);
  }
  set_width(width: PropertyValue) {
    this.SetPropertyValue(PropertyKey.kWidthProperty, width);
  }
  set_height(height: PropertyValue) {
    this.SetPropertyValue(PropertyKey.kHeightProperty, height);
  }

  SetPropertyValue(key: PropertyKey,
                   value?: PropertyValue) {
    super.SetPropertyValue(key, value);
  }
}

// This class provides the ability to determine whether the properties of two
// CSSComputedStyleData objects match for a given set of property keys.
export class PropertySetMatcher {
  properties_: PropertyKey[] = [];
  properties_bitset_ = new Set<PropertyKey>();
  constructor(properties: PropertyKey[]) {
    this.properties_ = properties;
    for (let i = 0; i < this.properties_.length; ++i) {
      let property_key = this.properties_[i];
      DCHECK_GT(property_key, PropertyKey.kNoneProperty);
      DCHECK_LE(property_key, PropertyKey.kMaxLonghandPropertyKey);
      this.properties_bitset_.add(property_key);
    }
  }

  DoDeclaredPropertiesMatch(
    lhs: ComputedStyleData,
    rhs: ComputedStyleData): boolean {

    for (let i = 0; i < this.properties_.length; ++i) {
      let property_key = this.properties_[i];
      let left = lhs.declared_property_values_.get(property_key)!;
      let right = rhs.declared_property_values_.get(property_key)!;
      if (Boolean(!!left) !== Boolean(right)) {
        return false;
      }
      if (left && !left.EQ(right)) {
        return false;
      }
    }
    return true;
  }
}
