import { ComputedStyleDeclaration } from './computed_style_declaration';
import { ComputedStyleData, MutableComputedStyleData } from './computed_style_data';
import { Size } from '../math/size';
import { DCHECK } from '@neditor/core/base/check';
import { KeywordValue, Value } from './keyword_value';
import { PropertyValue } from './property_value';
import {
  GetInheritedAnimatableProperties,
  GetInheritedProperties,
  GetPropertyInitialValue, GetPropertyName,
  PropertyKey
} from './property_definitions';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { LengthUnit, LengthValue } from './length_value';
import { DCHECK_EQ, DCHECK_GE, DCHECK_GT, DCHECK_LE } from '@neditor/core/base/check_op';
import { RGBAColorValue } from './rgba_color_value';
import { DefaultingPropertyValueVisitor, NotReachedPropertyValueVisitor } from './property_value_visitor';
import { PropertyListValue, PropertyListValueBuilder } from './property_list_value';
import { baseGetTypeId } from '../base/type_id';
import { CalcValue } from './calc_value';
import { Optional } from '@neditor/core/base/common/typescript';
import { PercentageValue } from './percentage_value';
import { LengthsIndex, ShadowValue } from './shadow_value';
import { FontWeightValue } from './font_weight_value';
import { NumberValue } from './number_value';
import { TransformPropertyValue } from './transform_property_value';
import { TransformFunctionListValue, TransformFunctionListValueBuilder } from './transform_function_list_value';
import { Trait, TransformFunction } from './transform_function';
import { TransformFunctionVisitor } from './transform_function_visitor';
import { MatrixFunction } from './matrix_function';
import { RotateFunction } from './rotate_function';
import { ScaleFunction } from './scale_function';
import { TranslateFunction } from './translate_function';

export function GetComputedStyleOfAnonymousBox(
  parent_computed_style_declaration: ComputedStyleDeclaration): ComputedStyleData {
  let computed_style =
    new MutableComputedStyleData();
  PromoteToComputedStyle(computed_style, parent_computed_style_declaration,
    parent_computed_style_declaration.data()!,
    new Size());
  return computed_style;
}

export function PromoteToComputedStyle(
  cascaded_style: MutableComputedStyleData,
  parent_computed_style_declaration: ComputedStyleDeclaration,
  root_computed_style: ComputedStyleData,
  viewport_size: Size,
  // GURLMap* const property_key_to_base_url_map
) {
  DCHECK(cascaded_style);
  DCHECK(parent_computed_style_declaration);
  DCHECK(root_computed_style);

  // Create a context for calculating the computed style.  This object is useful
  // because it can cache computed style values that are depended upon by other
  // properties' computed style calculations.
  let calculate_computed_style_context = new CalculateComputedStyleContext(
    cascaded_style, parent_computed_style_declaration,
    root_computed_style, viewport_size/*, property_key_to_base_url_map*/);

  // For each inherited, animatable property, set the property value to
  // inherited if it is not already declared. This causes the value to be
  // explicitly set within the CSSComputedStyleData and ensures that the
  // original value will be available for transitions (which need to know the
  // before and after state of the property) even when the property is inherited
  // from a parent that has changed.
  // const inherited_animatable_properties =
  //   GetInheritedAnimatableProperties();
  // for (let key of inherited_animatable_properties) {
  //   if (!cascaded_style.IsDeclared(key)) {
  //     cascaded_style.SetPropertyValue(key, KeywordValue.GetInherit());
  //   }
  // }

  const inherited_properties = GetInheritedProperties();
  for (let key of inherited_properties) {
    if (!cascaded_style.IsDeclared(key) && parent_computed_style_declaration.data().IsDeclared(key)) {
      cascaded_style.SetPropertyValue(key, KeywordValue.GetInherit());
    }
  }

  // Go through all declared values and calculate their computed values.
  let declared_property_values = cascaded_style.declared_property_values();
  for (let [k, v] of declared_property_values) {
    calculate_computed_style_context.SetComputedStyleForProperty(k, v);
  }

  calculate_computed_style_context.BlockifyIfNeeded();
}

// This helper class creates a context within which cascaded style properties
// can be efficiently promoted to computed properties.
// In particular, some computed style calculations depend on other computed
// styles, and this class manages the caching of those dependent values so that
// if they are depended upon more than once, they are quickly recalled, and if
// they are never depended upon, no extra time is spend resolving them.  For
// example, many properties depend on font size, and so they can simply call
// CalculateComputedStyleContext::GetFontSize() to obtain that value, and all
// computations will be handled internally.
class CalculateComputedStyleContext {

  // The style that, during the scope of CalculateComputedStyleContext, is
  // promoted from being a cascaded style to a computed style.
  private cascaded_style_: MutableComputedStyleData;

  // The parent computed style.
  private parent_computed_style_: ComputedStyleData;
  // The root computed style.
  private root_computed_style_: ComputedStyleData;

  // One percent of width and height of viewport size.
  private viewport_size_: Size;

  // Provides a base URL for each property key.  This is used by properties
  // that deal with URLs, such as background-image, to resolve relative URLs
  // based on which style sheet they were specified from.
  // GURLMap* const property_key_to_base_url_map_;

  // Cached computed values for a small specific set of properties that other
  // properties computed style calculations depend upon.  These are lazily
  // computed.
  private computed_border_bottom_style_?: PropertyValue;
  private computed_border_left_style_?: PropertyValue;
  private computed_border_right_style_?: PropertyValue;
  private computed_border_top_style_?: PropertyValue;
  private computed_color_?: PropertyValue;
  private computed_font_size_?: PropertyValue;
  private computed_outline_style_?: PropertyValue;
  private computed_position_?: PropertyValue;

  constructor(
    cascaded_style: MutableComputedStyleData,
    parent_computed_style_declaration: ComputedStyleDeclaration,
    root_computed_style: ComputedStyleData,
    viewport_size: Size,
    // GURLMap* const property_key_to_base_url_map)
  ) {
    this.cascaded_style_ = cascaded_style;
    this.parent_computed_style_ = parent_computed_style_declaration.data()!;
    this.root_computed_style_ = root_computed_style;
    this.viewport_size_ = viewport_size;
  }

  // Updates the property specified by the iterator to its computed value.
  SetComputedStyleForProperty(key: PropertyKey,
                              input_value: PropertyValue) {
    // If a property has keyword value 'inherit' or 'initial', it must be
    // set to the corresponding inherited or initial value.  In this case,
    // the parent's value is already computed so we can skip the computation
    // step.
    let { result, value } = this.HandleInheritOrInitial(key, input_value);
    if (!result) {
      this.HandleSpecifiedValue(key, value);
    }
    this.OnComputedStyleCalculated(key, value);
    if (value !== input_value) {
      this.cascaded_style_.SetPropertyValue(key, value);
    }
  }

  // For certain elements, the computed value of display becomes 'block'.
  //   https://www.w3.org/TR/CSS21/visuren.html#dis-pos-flo
  // This is amended by flexbox for 'inline-flex' and 'flex'.
  //   https://www.w3.org/TR/css-flexbox-1/#flex-containers
  // Flex items are also modified in this way.
  //   https://www.w3.org/TR/css-flexbox-1/#flex-items
  // In CSS Display 3 (which Cobalt does not yet implement), this process is
  // called 'blockification'/'blockify'.
  //   https://www.w3.org/TR/css-display-3/#blockify
  BlockifyIfNeeded() {
    let display = this.cascaded_style_.display;
    let is_inline_flex = display == KeywordValue.GetInlineFlex();
    let is_inline = display == KeywordValue.GetInline() ||
      display == KeywordValue.GetInlineBlock() || is_inline_flex;
    let parent_display = this.parent_computed_style_.display;
    let parent_is_flex_container =
      parent_display == KeywordValue.GetFlex() ||
      parent_display == KeywordValue.GetInlineFlex();

    // Blockification is applied for elements with in inline outer display type
    // inline when they are either absolutely positioned,
    //   https://www.w3.org/TR/CSS21/visuren.html#dis-pos-flo
    // or when they are flex items.
    //   https://www.w3.org/TR/css-flexbox-1/#flex-items
    // Since children of flex containers are either flex items or absolutely
    // positioned, we apply blockification for all flex children.
    if (is_inline && (this.IsAbsolutelyPositioned() || parent_is_flex_container)) {
      if (is_inline_flex) {
        this.cascaded_style_.set_display(KeywordValue.GetFlex());
      } else {
        this.cascaded_style_.set_display(KeywordValue.GetBlock());
      }
    }
    this.cascaded_style_.set_is_inline_before_blockification(is_inline);
  }

  // Immediately promote the specified property key to computed value (if
  // necessary).
  private ComputeValue(key: PropertyKey) {
    if (this.cascaded_style_.IsDeclared(key)) {
      let cascaded_value =
        this.cascaded_style_.GetDeclaredPropertyValueReference(key);
      this.SetComputedStyleForProperty(key, cascaded_value);
    } else {
      let computed_value =
        this.cascaded_style_.GetPropertyValueReference(key);
      this.OnComputedStyleCalculated(key, computed_value);
    }
  }

  // Check if the property value is set to inherit or initial, and assign it
  // an appropriate computed value in this case.
  HandleInheritOrInitial(key: PropertyKey,
                         value: PropertyValue): { result: boolean, value: PropertyValue } {
    if (value == KeywordValue.GetInherit()) {
      // Add this property to the list of those that inherited their declared
      // value from the parent. This allows the computed style to later determine
      // if a value that was explicitly inherited from the parent is no longer
      // valid.
      this.cascaded_style_.AddDeclaredPropertyInheritedFromParent(key);
      value = this.parent_computed_style_.GetPropertyValue(key);
      return { result: true, value };
    } else if (value == KeywordValue.GetInitial()) {
      value = GetPropertyInitialValue(key);
      // If the initial value is current color, it still requires to do further
      // processing.
      return {
        result: value != KeywordValue.GetCurrentColor(),
        value,
      };
    } else {
      return {
        result: false,
        value,
      };
    }
  }

  // Check what property property we are dealing with, and promote it to
  // a computed value accordingly (e.g. by invoking one of the many different
  // computed style computations defined above.)
  private HandleSpecifiedValue(key: PropertyKey,
                               value: PropertyValue) {
    switch (key) {
      case PropertyKey.kBackgroundPositionProperty: {
        let background_position_provider = new ComputedBackgroundPositionProvider(
          this.GetFontSize(), this.GetRootFontSize(), this.GetViewportSizeOnePercent());
        value.Accept(background_position_provider);
        let computed_background_position = background_position_provider.computed_background_position();
        if (computed_background_position) {
          value = computed_background_position;
        }
      }
        break;
      case PropertyKey.kBorderBottomColorProperty:
      case PropertyKey.kBorderLeftColorProperty:
      case PropertyKey.kBorderRightColorProperty:
      case PropertyKey.kBorderTopColorProperty:
      case PropertyKey.kOutlineColorProperty:
      case PropertyKey.kTextDecorationColorProperty: {
        if (value == KeywordValue.GetCurrentColor()) {
          // The computed value of the 'currentColor' keyword is the computed
          // value of the 'color' property.
          value = this.GetColor();
        }
      }
        break;
      case PropertyKey.kBorderBottomWidthProperty:
      case PropertyKey.kBorderLeftWidthProperty:
      case PropertyKey.kBorderRightWidthProperty:
      case PropertyKey.kBorderTopWidthProperty:
      case PropertyKey.kOutlineWidthProperty: {
        let border_width_provider = new ComputedBorderWidthProvider(
          this.GetFontSize(), this.GetRootFontSize(), this.GetViewportSizeOnePercent(),
          this.GetBorderOrOutlineStyleBasedOnWidth(key));
        value.Accept(border_width_provider);
        value = border_width_provider.computed_border_width();
      }
        break;
      case PropertyKey.kBoxShadowProperty:
      case PropertyKey.kTextShadowProperty: {
        let shadow_provider = new ComputedShadowProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent(),
          this.GetColor());
        value.Accept(shadow_provider);
        value = shadow_provider.computed_shadow();
      }
        break;
      case PropertyKey.kFlexBasisProperty: {
        let flex_basis_provider = new ComputedFlexBasisProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(flex_basis_provider);
        value = flex_basis_provider.computed_value();
      }
        break;
      case PropertyKey.kFontSizeProperty: {
        // Only compute this if computed_font_size_ isn't set, otherwise that
        // is an indication that it was previously computed as a dependency for
        // another property value computation.
        if (!this.computed_font_size_) {
          let font_size_provider = new ComputedFontSizeProvider(
            this.parent_computed_style_.font_size as LengthValue,
            this.GetRootFontSize(),
            this.GetViewportSizeOnePercent());
          value.Accept(font_size_provider);
          if (font_size_provider.computed_font_size()) {
            value = font_size_provider.computed_font_size();
          }
        }
      }
        break;
      case PropertyKey.kFontWeightProperty: {
        let font_weight_provider = new ComputedFontWeightProvider();
        value.Accept(font_weight_provider);
        value = font_weight_provider.computed_font_weight();
      }
        break;
      case PropertyKey.kHeightProperty: {
        let height_provider = new ComputedHeightProvider(
          this.parent_computed_style_.height,
          this.parent_computed_style_.top,
          this.parent_computed_style_.bottom,
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent(),
          this.IsAbsolutelyPositioned());
        value.Accept(height_provider);
        value = height_provider.computed_height();
      }
        break;
      case PropertyKey.kLineHeightProperty: {
        let line_height_provider = new ComputedLineHeightProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(line_height_provider);
        value = line_height_provider.computed_line_height();
      }
        break;
      case PropertyKey.kMarginBottomProperty:
      case PropertyKey.kMarginLeftProperty:
      case PropertyKey.kMarginRightProperty:
      case PropertyKey.kMarginTopProperty: {
        let margin_provider = new ComputedMarginOrPaddingEdgeProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(margin_provider);
        value = margin_provider.computed_margin_or_padding_edge();
      }
        break;
      case PropertyKey.kPaddingBottomProperty:
      case PropertyKey.kPaddingLeftProperty:
      case PropertyKey.kPaddingRightProperty:
      case PropertyKey.kPaddingTopProperty: {
        let padding_provider = new ComputedMarginOrPaddingEdgeProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(padding_provider);
        value = padding_provider.computed_margin_or_padding_edge();
      }
        break;
      case PropertyKey.kMaxHeightProperty: {
        let max_height_provider = new ComputedMaxHeightProvider(
          this.parent_computed_style_.height,
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent(),
          this.IsAbsolutelyPositioned());
        value.Accept(max_height_provider);
        value = max_height_provider.computed_max_height();
      }
        break;
      case PropertyKey.kMinHeightProperty: {
        let min_height_provider = new ComputedMinHeightProvider(
          this.parent_computed_style_.height,
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent(),
          this.IsAbsolutelyPositioned());
        value.Accept(min_height_provider);
        value = min_height_provider.computed_min_height();
      }
        break;
      case PropertyKey.kMaxWidthProperty:
      case PropertyKey.kMinWidthProperty: {
        let min_max_width_provider = new ComputedMinMaxWidthProvider(
          this.parent_computed_style_.width,
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(min_max_width_provider);
        value = min_max_width_provider.computed_min_max_width();
      }
        break;
      case PropertyKey.kWidthProperty: {
        let width_provider = new ComputedWidthProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(width_provider);
        value = width_provider.computed_value();
      }
        break;
      case PropertyKey.kBackgroundImageProperty: {
        NOTIMPLEMENTED();
        // if (property_key_to_base_url_map_) {
        //   let  background_image_provider = ComputedBackgroundImageProvider(
        //     (*property_key_to_base_url_map_)[kBackgroundImageProperty],
        //     GetFontSize(), GetRootFontSize(), GetViewportSizeOnePercent());
        //   (*value).Accept(&background_image_provider);
        // *value = background_image_provider.computed_background_image();
        // }
      }
        break;
      case PropertyKey.kBackgroundSizeProperty: {
        let background_size_provider = new ComputedBackgroundSizeProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(background_size_provider);
        value = background_size_provider.computed_background_size();
      }
        break;
      case PropertyKey.kBorderBottomLeftRadiusProperty:
      case PropertyKey.kBorderBottomRightRadiusProperty:
      case PropertyKey.kBorderTopLeftRadiusProperty:
      case PropertyKey.kBorderTopRightRadiusProperty: {
        let border_radius_provider = new ComputedBorderRadiusProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(border_radius_provider);
        value = border_radius_provider.computed_border_radius();
      }
        break;
      case PropertyKey.kTextIndentProperty: {
        let text_indent_provider = new ComputedTextIndentProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(text_indent_provider);
        value = text_indent_provider.computed_text_indent();
      }
        break;
      case PropertyKey.kTransformOriginProperty: {
        let transform_origin_provider = new ComputedTransformOriginProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(transform_origin_provider);
        value = transform_origin_provider.computed_transform_origin();
      }
        break;
      case PropertyKey.kTransformProperty: {
        let transform_provider = new ComputedTransformProvider(
          this.GetFontSize(),
          this.GetRootFontSize(),
          this.GetViewportSizeOnePercent());
        value.Accept(transform_provider);
        value = transform_provider.computed_transform_list();
      }
        break;
      case PropertyKey.kBottomProperty:
      case PropertyKey.kLeftProperty:
      case PropertyKey.kRightProperty:
      case PropertyKey.kTopProperty: {
        let position_offset_provider = new ComputedPositionOffsetProvider(
          this.GetFontSize(), this.GetRootFontSize(), this.GetViewportSizeOnePercent());
        value.Accept(position_offset_provider);
        value = position_offset_provider.computed_position_offset();
      }
        break;

      // The specified value resolves directly to the computed value for these
      // properties.
      case PropertyKey.kAlignContentProperty:
      case PropertyKey.kAlignItemsProperty:
      case PropertyKey.kAlignSelfProperty:
      // case PropertyKey.kAnimationDelayProperty:
      // case PropertyKey.kAnimationDirectionProperty:
      // case PropertyKey.kAnimationDurationProperty:
      // case PropertyKey.kAnimationFillModeProperty:
      // case PropertyKey.kAnimationIterationCountProperty:
      // case PropertyKey.kAnimationNameProperty:
      // case PropertyKey.kAnimationTimingFunctionProperty:
      case PropertyKey.kBackgroundColorProperty:
      case PropertyKey.kBackgroundRepeatProperty:
      case PropertyKey.kBorderBottomStyleProperty:
      case PropertyKey.kBorderLeftStyleProperty:
      case PropertyKey.kBorderRightStyleProperty:
      case PropertyKey.kBorderTopStyleProperty:
      case PropertyKey.kColorProperty:
      case PropertyKey.kContentProperty:
      case PropertyKey.kDisplayProperty:
      case PropertyKey.kFilterProperty:
      case PropertyKey.kFlexDirectionProperty:
      case PropertyKey.kFlexGrowProperty:
      case PropertyKey.kFlexShrinkProperty:
      case PropertyKey.kFlexWrapProperty:
      case PropertyKey.kFontFamilyProperty:
      case PropertyKey.kFontStyleProperty:
      case PropertyKey.kIntersectionObserverRootMarginProperty:
      case PropertyKey.kJustifyContentProperty:
      case PropertyKey.kOpacityProperty:
      case PropertyKey.kOrderProperty:
      case PropertyKey.kOutlineStyleProperty:
      case PropertyKey.kOverflowProperty:
      case PropertyKey.kOverflowWrapProperty:
      case PropertyKey.kPointerEventsProperty:
      case PropertyKey.kPositionProperty:
      case PropertyKey.kTextAlignProperty:
      case PropertyKey.kTextDecorationLineProperty:
      case PropertyKey.kTextOverflowProperty:
      case PropertyKey.kTextTransformProperty:
      // case PropertyKey.kTransitionDelayProperty:
      // case PropertyKey.kTransitionDurationProperty:
      // case PropertyKey.kTransitionPropertyProperty:
      // case PropertyKey.kTransitionTimingFunctionProperty:
      case PropertyKey.kVerticalAlignProperty:
      case PropertyKey.kVisibilityProperty:
      case PropertyKey.kWhiteSpaceProperty:
      case PropertyKey.kWordWrapProperty:
      case PropertyKey.kZIndexProperty:
        // Nothing.
        break;

      // Shorthand properties and at-rule properties should not occur here because
      // they do not have computed values themselves.
      case PropertyKey.kAllProperty:
      // case PropertyKey.kAnimationProperty:
      case PropertyKey.kBackgroundProperty:
      case PropertyKey.kBorderBottomProperty:
      case PropertyKey.kBorderColorProperty:
      case PropertyKey.kBorderLeftProperty:
      case PropertyKey.kBorderProperty:
      case PropertyKey.kBorderRadiusProperty:
      case PropertyKey.kBorderRightProperty:
      case PropertyKey.kBorderStyleProperty:
      case PropertyKey.kBorderTopProperty:
      case PropertyKey.kBorderWidthProperty:
      case PropertyKey.kFlexProperty:
      case PropertyKey.kFlexFlowProperty:
      case PropertyKey.kFontProperty:
      case PropertyKey.kMarginProperty:
      case PropertyKey.kNoneProperty:
      case PropertyKey.kOutlineProperty:
      case PropertyKey.kPaddingProperty:
      case PropertyKey.kSrcProperty:
      case PropertyKey.kTextDecorationProperty:
      // case PropertyKey.kTransitionProperty:
      case PropertyKey.kUnicodeRangeProperty:
        NOTREACHED();
        break;
    }
  }

  // If the modified value was a (potentially) dependent property value, cache
  // its computed value so that we know it has been computed.
  OnComputedStyleCalculated(key: PropertyKey,
                            value: PropertyValue) {
    switch (key) {
      case PropertyKey.kFontSizeProperty:
        this.computed_font_size_ = value;
        break;
      case PropertyKey.kPositionProperty:
        this.computed_position_ = value;
        break;
      case PropertyKey.kBorderBottomStyleProperty:
        this.computed_border_bottom_style_ = value;
        break;
      case PropertyKey.kBorderLeftStyleProperty:
        this.computed_border_left_style_ = value;
        break;
      case PropertyKey.kBorderRightStyleProperty:
        this.computed_border_right_style_ = value;
        break;
      case PropertyKey.kBorderTopStyleProperty:
        this.computed_border_top_style_ = value;
        break;
      case PropertyKey.kColorProperty:
        this.computed_color_ = value;
        break;
      case PropertyKey.kOutlineStyleProperty:
        this.computed_outline_style_ = value;
        break;

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
      case PropertyKey.kBorderBottomProperty:
      case PropertyKey.kBorderBottomColorProperty:
      case PropertyKey.kBorderBottomLeftRadiusProperty:
      case PropertyKey.kBorderBottomRightRadiusProperty:
      case PropertyKey.kBorderBottomWidthProperty:
      case PropertyKey.kBorderColorProperty:
      case PropertyKey.kBorderLeftProperty:
      case PropertyKey.kBorderLeftColorProperty:
      case PropertyKey.kBorderLeftWidthProperty:
      case PropertyKey.kBorderRadiusProperty:
      case PropertyKey.kBorderRightProperty:
      case PropertyKey.kBorderRightColorProperty:
      case PropertyKey.kBorderRightWidthProperty:
      case PropertyKey.kBorderStyleProperty:
      case PropertyKey.kBorderTopProperty:
      case PropertyKey.kBorderTopColorProperty:
      case PropertyKey.kBorderTopLeftRadiusProperty:
      case PropertyKey.kBorderTopRightRadiusProperty:
      case PropertyKey.kBorderTopWidthProperty:
      case PropertyKey.kBorderProperty:
      case PropertyKey.kBorderWidthProperty:
      case PropertyKey.kBottomProperty:
      case PropertyKey.kBoxShadowProperty:
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
      case PropertyKey.kFontFamilyProperty:
      case PropertyKey.kFontProperty:
      case PropertyKey.kFontStyleProperty:
      case PropertyKey.kFontWeightProperty:
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
      case PropertyKey.kOutlineColorProperty:
      case PropertyKey.kOutlineWidthProperty:
      case PropertyKey.kOverflowProperty:
      case PropertyKey.kOverflowWrapProperty:
      case PropertyKey.kPaddingBottomProperty:
      case PropertyKey.kPaddingLeftProperty:
      case PropertyKey.kPaddingProperty:
      case PropertyKey.kPaddingRightProperty:
      case PropertyKey.kPaddingTopProperty:
      case PropertyKey.kPointerEventsProperty:
      case PropertyKey.kRightProperty:
      case PropertyKey.kSrcProperty:
      case PropertyKey.kTextAlignProperty:
      case PropertyKey.kTextDecorationColorProperty:
      case PropertyKey.kTextDecorationLineProperty:
      case PropertyKey.kTextDecorationProperty:
      case PropertyKey.kTextIndentProperty:
      case PropertyKey.kTextOverflowProperty:
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
  }

  // Helper function to determine if the computed style implies absolute
  // positioning.
  IsAbsolutelyPositioned(): boolean {
    // An absolutely positioned element (or its box) implies that the element's
    // 'position' property has the value 'absolute' or 'fixed'.
    //   https://www.w3.org/TR/CSS21/visuren.html#absolutely-positioned
    if (!this.computed_position_) {
      this.ComputeValue(PropertyKey.kPositionProperty);
    }

    DCHECK(this.computed_position_);
    return this.computed_position_ == KeywordValue.GetAbsolute() ||
      this.computed_position_ == KeywordValue.GetFixed();
  }

  // Helper function to return the computed font size.
  GetFontSize(): LengthValue {
    if (!this.computed_font_size_) {
      this.ComputeValue(PropertyKey.kFontSizeProperty);
    }

    DCHECK(this.computed_font_size_);
    return this.computed_font_size_ as LengthValue;
  }
  // Helper function to return the computed font size of root element.
  GetRootFontSize() {
    return this.root_computed_style_.font_size as LengthValue;
  }
  // Helper function to return one percent of the viewport size .
  GetViewportSizeOnePercent(): Size {
    return this.viewport_size_;
  }

  // Helper function to return the computed border style for an edge based on
  // border width properties.
  GetBorderOrOutlineStyleBasedOnWidth(key: PropertyKey): PropertyValue {
    if (key == PropertyKey.kBorderBottomWidthProperty) {
      return this.GetBorderBottomStyle();
    } else if (key == PropertyKey.kBorderLeftWidthProperty) {
      return this.GetBorderLeftStyle();
    } else if (key == PropertyKey.kBorderRightWidthProperty) {
      return this.GetBorderRightStyle();
    } else if (key == PropertyKey.kBorderTopWidthProperty) {
      return this.GetBorderTopStyle();
    } else {
      DCHECK_EQ(key, PropertyKey.kOutlineWidthProperty);
      return this.GetOutlineStyle();
    }
  }
  GetBorderBottomStyle(): PropertyValue {
    if (!this.computed_border_bottom_style_) {
      this.ComputeValue(PropertyKey.kBorderBottomStyleProperty);
    }

    DCHECK(this.computed_border_bottom_style_);
    return this.computed_border_bottom_style_!;
  }
  GetBorderLeftStyle(): PropertyValue {
    if (!this.computed_border_left_style_) {
      this.ComputeValue(PropertyKey.kBorderLeftStyleProperty);
    }

    DCHECK(this.computed_border_left_style_);
    return this.computed_border_left_style_!;
  }
  GetBorderRightStyle(): PropertyValue {
    if (!this.computed_border_right_style_) {
      this.ComputeValue(PropertyKey.kBorderRightStyleProperty);
    }

    DCHECK(this.computed_border_right_style_);
    return this.computed_border_right_style_!;
  }
  GetBorderTopStyle(): PropertyValue {
    if (!this.computed_border_top_style_) {
      this.ComputeValue(PropertyKey.kBorderTopStyleProperty);
    }

    DCHECK(this.computed_border_top_style_);
    return this.computed_border_top_style_!;
  }
  GetOutlineStyle(): PropertyValue {
    if (!this.computed_outline_style_) {
      this.ComputeValue(PropertyKey.kOutlineStyleProperty);
    }

    DCHECK(this.computed_outline_style_);
    return this.computed_outline_style_!;
  }

  // Helper function to return the computed color.
  GetColor(): RGBAColorValue {
    if (!this.computed_color_) {
      this.ComputeValue(PropertyKey.kColorProperty);
    }

    DCHECK(this.computed_color_);
    return this.computed_color_ as RGBAColorValue;
  }

};

// ComputedBackgroundPositionProvider provides a property list which has two
// CalcValue. Each of CalcValue has two parts <percentage> and <length>.
// <percentage> and <length> values here represent an offset of the top left
// corner of the background image from the top left corner of the background
// positioning area.
//   https://www.w3.org/TR/css3-background/#the-background-position
class ComputedBackgroundPositionProvider extends NotReachedPropertyValueVisitor {
  computed_font_size_: LengthValue;
  root_computed_font_size_: LengthValue;
  viewport_size_: Size;
  computed_background_position_?: PropertyValue;

  constructor(
    computed_font_size: LengthValue,
    root_computed_font_size: LengthValue,
    viewport_size: Size,
  ) {
    super();
    this.computed_font_size_ = computed_font_size;
    this.root_computed_font_size_ = root_computed_font_size;
    this.viewport_size_ = viewport_size;
  }

  VisitPropertyList(property_list_value: PropertyListValue) {
    let size = property_list_value.value().length;
    DCHECK_GE(size, 1);
    DCHECK_LE(size, 4);

    let position_helper = new ComputedPositionHelper(
      this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
    let background_position_builder: PropertyValue[] = [];

    position_helper.ComputePosition(property_list_value.value(),
      background_position_builder);

    this.computed_background_position_ =
      new PropertyListValue(background_position_builder);
  }

  computed_background_position() {
    return this.computed_background_position_;
  }

}

enum Direction {
  kHorizontal,
  kVertical,
  kCenter,
  kNone,
}

class OriginInfo {
  constructor(
    public origin_as_percentage: number,
    public offset_multiplier: number,
    public direction: Direction,
  ) {}
};

// Helper class for |ComputedBackgroundPositionProvider| and
// |ComputedTransformOriginProvider| to resolve the computed value of position
// part.
//   https://www.w3.org/TR/css3-background/#the-background-position
//   https://www.w3.org/TR/css3-transforms/#propdef-transform-origin
class ComputedPositionHelper {
  private computed_font_size_: LengthValue;
  private root_computed_font_size_: LengthValue;
  private viewport_size_: Size;

  constructor(computed_font_size: LengthValue, root_computed_font_size: LengthValue, viewport_size: Size) {
    this.computed_font_size_ = computed_font_size;
    this.root_computed_font_size_ = root_computed_font_size;
    this.viewport_size_ = viewport_size;
  }

  // Forwards the call on to the appropriate method depending on the number
  // of parameters in |input_position_builder|.
  ComputePosition(input_position_builder: PropertyListValueBuilder,
                  output_position_builder: PropertyListValueBuilder) {
    switch (input_position_builder.length) {
      case 1:
        this.ComputeOneValuePosition(input_position_builder, output_position_builder);
        break;
      case 2:
        this.ComputeTwoValuesPosition(input_position_builder, output_position_builder);
        break;
      case 3:  // fall-through
      case 4:
        this.ComputeThreeOrFourValuesPosition(input_position_builder,
          output_position_builder);
        break;
    }
  }

  // Only resolve the first value of |input_position_builder|, other than the
  // first value would be ignored.
  ComputeOneValuePosition(input_position_builder: PropertyListValueBuilder,
                          output_position_builder: PropertyListValueBuilder) {
    DCHECK_GE(input_position_builder.length, 1);

    let position_builder: PropertyListValueBuilder = [];
    position_builder.push(input_position_builder[0]);
    position_builder.push(KeywordValue.GetCenter());

    this.ComputeTwoValuesPosition(position_builder, output_position_builder);
  }

  // Only resolve the first two values of |input_position_builder|, other than
  // the first two values would be ignored.
  ComputeTwoValuesPosition(input_position_builder: PropertyListValueBuilder,
                           output_position_builder: PropertyListValueBuilder) {
    DCHECK_GE(input_position_builder.length, 2);

    for (let i = 0; i < 2; ++i) {
      let current_value: PropertyValue = input_position_builder[i];

      if (current_value.GetTypeId() == baseGetTypeId(CalcValue)) {
        // If it is already a CalcValue, nothing needs to be done.
        (output_position_builder)[i] = current_value;
      } else if (current_value.GetTypeId() == baseGetTypeId(KeywordValue)) {
        this.FillPositionBuilderFromOriginAndOffset(current_value, undefined,
          output_position_builder);
      } else {
        let default_origin = new OriginInfo(0.0, 1, Direction.kNone);
        (output_position_builder)[i] =
          this.ProvideCalcValueFromOriginAndOffset(default_origin, current_value);
      }
    }
  }

  // Only resolve three or four values of |input_position_builder|.
  ComputeThreeOrFourValuesPosition(input_position_builder: PropertyListValueBuilder,
                                   output_position_builder: PropertyListValueBuilder) {
    DCHECK_GT(input_position_builder.length, 2);
    DCHECK_LE(input_position_builder.length, 4);

    for (let i = 0; i < input_position_builder.length; ++i) {
      let previous_value: Optional<PropertyValue> =
        (i == 0) ? undefined : input_position_builder[i - 1];

      let current_value = input_position_builder[i];

      if (current_value.GetTypeId() == baseGetTypeId(KeywordValue)) {
        this.FillPositionBuilderFromOriginAndOffset(current_value, undefined,
          output_position_builder);
      } else {
        DCHECK(previous_value);
        DCHECK(previous_value!.GetTypeId() == baseGetTypeId(KeywordValue));
        this.FillPositionBuilderFromOriginAndOffset(previous_value!, current_value,
          output_position_builder);
      }
    }
  }

  private ConvertToOriginInfo(keyword: PropertyValue): OriginInfo {
    DCHECK(keyword.GetTypeId() == baseGetTypeId(KeywordValue));

    if (keyword == KeywordValue.GetLeft()) {
      return new OriginInfo(0.0, 1, Direction.kHorizontal);
    } else if (keyword == KeywordValue.GetRight()) {
      return new OriginInfo(1.0, -1, Direction.kHorizontal);
    } else if (keyword == KeywordValue.GetTop()) {
      return new OriginInfo(0.0, 1, Direction.kVertical);
    } else if (keyword == KeywordValue.GetBottom()) {
      return new OriginInfo(1.0, -1, Direction.kVertical);
    } else {
      return new OriginInfo(0.5, 1, Direction.kCenter);
    }
  }

  private ProvideCalcValueFromOriginAndOffset(
    origin_info: OriginInfo, offset: Optional<PropertyValue>): CalcValue {
    DCHECK(origin_info);

    if (!offset) {
      return new CalcValue(
        new PercentageValue(origin_info.origin_as_percentage));
    }

    let length_value: LengthValue;
    let percentage_value: PercentageValue;
    if (offset.GetTypeId() == baseGetTypeId(LengthValue)) {
      let length_provider: LengthValue = ProvideAbsoluteLength(offset as LengthValue,
        this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
      length_value = new LengthValue(
        origin_info.offset_multiplier * length_provider.value(),
        length_provider.unit());
      percentage_value = new PercentageValue(origin_info.origin_as_percentage);

      return new CalcValue(length_value, percentage_value);
    } else {
      DCHECK(offset.GetTypeId() == baseGetTypeId(PercentageValue));
      let percentage: PercentageValue = offset as PercentageValue;
      percentage_value = new PercentageValue(origin_info.origin_as_percentage +
        origin_info.offset_multiplier *
        percentage.value());

      return new CalcValue(percentage_value);
    }
  }

  private FillPositionBuilderFromOriginAndOffset(
    origin: PropertyValue,
    offset: Optional<PropertyValue>,
    output_position_builder: PropertyListValueBuilder) {
    DCHECK(origin.GetTypeId() == baseGetTypeId(KeywordValue));

    let origin_info = this.ConvertToOriginInfo(origin);
    switch (origin_info.direction) {
      case Direction.kHorizontal: {
        (output_position_builder)[0] =
          this.ProvideCalcValueFromOriginAndOffset(origin_info, offset);
        break;
      }
      case Direction.kVertical: {
        (output_position_builder)[1] =
          this.ProvideCalcValueFromOriginAndOffset(origin_info, offset);
        break;
      }
      case Direction.kCenter: {
        if (!(output_position_builder)[0]) {
          (output_position_builder)[0] =
            this.ProvideCalcValueFromOriginAndOffset(origin_info, offset);
        }
        if (!(output_position_builder)[1]) {
          (output_position_builder)[1] =
            this.ProvideCalcValueFromOriginAndOffset(origin_info, offset);
        }
        break;
      }
      case Direction.kNone:  // fall-through
        NOTREACHED();
        break;
    }
  }
};

function ProvideAbsoluteLength(
  specified_length: LengthValue,
  computed_font_size: LengthValue,
  root_computed_font_size: LengthValue,
  viewport_size: Size): LengthValue {
  switch (specified_length.unit()) {
    // "px" is an absolute unit.
    //   https://www.w3.org/TR/css3-values/#absolute-lengths
    case  LengthUnit.kPixelsUnit:
      return specified_length;

    // "em" equals to the computed value of the "font-size" property of
    // the element on which it is used.
    //   https://www.w3.org/TR/css3-values/#font-relative-lengths
    case  LengthUnit.kFontSizesAkaEmUnit: {
      DCHECK_EQ(LengthUnit.kPixelsUnit, computed_font_size.unit());

      return new LengthValue(
        computed_font_size.value() * specified_length.value(), LengthUnit.kPixelsUnit);
    }

    // "rem" equals to the computed value of font-size on the root element.
    //   https://www.w3.org/TR/css3-values/#font-relative-lengths
    case   LengthUnit.kRootElementFontSizesAkaRemUnit: {
      DCHECK_EQ(LengthUnit.kPixelsUnit, root_computed_font_size.unit());

      return new LengthValue(
        root_computed_font_size.value() * specified_length.value(),
        LengthUnit.kPixelsUnit);
    }

    // "vw" equal to 1% of the width of the initial containing block.
    //   https://www.w3.org/TR/css3-values/#viewport-relative-lengths
    case     LengthUnit.kViewportWidthPercentsAkaVwUnit: {
      return new LengthValue(
        viewport_size.width() * specified_length.value() / 100.0,
        LengthUnit.kPixelsUnit);
    }

    // "vh" equal to 1% of the height of the initial containing block.
    //   https://www.w3.org/TR/css3-values/#viewport-relative-lengths
    case   LengthUnit.kViewportHeightPercentsAkaVhUnit: {
      return new LengthValue(
        viewport_size.height() * specified_length.value() / 100.0,
        LengthUnit.kPixelsUnit);
    }
  }
  NOTREACHED();
}

// Computed value: absolute length;
//                 '0' if the border style is 'none' or 'hidden'.
//   https://www.w3.org/TR/css3-background/#border-width
class ComputedBorderWidthProvider extends NotReachedPropertyValueVisitor {
  computed_border_width_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
    private border_style_: PropertyValue
  ) {super();}

  VisitLength(specified_length: LengthValue) {
    if (this.border_style_ == KeywordValue.GetNone() ||
      this.border_style_ == KeywordValue.GetHidden()) {
      this.computed_border_width_ = new LengthValue(0, LengthUnit.kPixelsUnit);
    } else {
      DCHECK_EQ(this.border_style_, KeywordValue.GetSolid());
      this.computed_border_width_ =
        ProvideAbsoluteLength(specified_length, this.computed_font_size_,
          this.root_computed_font_size_, this.viewport_size_);
    }
  }

  computed_border_width(): PropertyValue {
    return this.computed_border_width_!;
  }
};

// Computed value: any <length> made absolute; any specified color computed;
// otherwise as specified.
//   https://www.w3.org/TR/css3-background/#box-shadow
//   https://www.w3.org/TR/css-text-decor-3/#text-shadow-property
class ComputedShadowProvider extends NotReachedPropertyValueVisitor {
  private computed_shadow_?: PropertyValue;
  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
    private computed_color_: RGBAColorValue,
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kNone:
        this.computed_shadow_ = keyword;
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
  VisitPropertyList(property_list_value: PropertyListValue) {
    let builder: PropertyListValueBuilder = new Array(property_list_value.value().length);

    for (let i = 0; i < property_list_value.value().length; ++i) {
      let shadow_value = property_list_value.value()[i] as ShadowValue;

      let computed_lengths: LengthValue[] = [];
      for (let j = 0; j < LengthsIndex.kMaxLengths; ++j) {
        let specified_length: LengthValue = shadow_value.lengths()[j];
        if (specified_length) {
          computed_lengths[j] =
            ProvideAbsoluteLength(specified_length, this.computed_font_size_,
              this.root_computed_font_size_, this.viewport_size_);
        }
      }

      let color: RGBAColorValue = shadow_value.color();
      if (!color) {
        color = new RGBAColorValue(this.computed_color_.value());
      }

      builder.push(
        new ShadowValue(computed_lengths, color, shadow_value.has_inset()));
    }

    this.computed_shadow_ = new PropertyListValue(builder);
  }

  computed_shadow(): PropertyValue {
    return this.computed_shadow_!;
  }
}

// Computed value: the percentage or "auto" as specified or the absolute length.
//   https://www.w3.org/TR/CSS21/visudet.html#the-width-property
class ComputedWidthValueProvider extends NotReachedPropertyValueVisitor {
  protected computed_value_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
  ) {super();}

  VisitLength(specified_length: LengthValue) {
    this.computed_value_ =
      ProvideAbsoluteLength(specified_length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    this.computed_value_ = percentage;
  }

  computed_value(): PropertyValue {
    return this.computed_value_!;
  }
}

// Computed value: For all values other than auto and content, flex-basis is
// resolved the same way as width.
//  https://www.w3.org/TR/css-flexbox-1/#flex-basis-property
class ComputedFlexBasisProvider extends ComputedWidthValueProvider {
  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
      case Value.kContent:
        this.computed_value_ = keyword;
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

// Computed value: absolute length.
//   https://www.w3.org/TR/css3-fonts/#font-size-prop
class ComputedFontSizeProvider extends NotReachedPropertyValueVisitor {
  private computed_font_size_?: LengthValue;
  constructor(
    private parent_computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
  ) {super();}

  VisitLength(length: LengthValue) {
    // "em" on "font-size" is calculated relatively to the inherited value
    // of "font-size".
    //   https://www.w3.org/TR/css3-values/#font-relative-lengths
    this.computed_font_size_ =
      ProvideAbsoluteLength(length, this.parent_computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(specified_percentage: PercentageValue) {
    // A percentage value specifies an absolute font size relative to the parent
    // element's fonts size.
    //   https://www.w3.org/TR/css3-fonts/#percentage-size-value
    this.computed_font_size_ = new LengthValue(
      this.parent_computed_font_size_.value() * specified_percentage.value(),
      LengthUnit.kPixelsUnit);
  }

  computed_font_size(): LengthValue {
    return this.computed_font_size_!;
  }
}

// Computed value: numeric weight value.
//   https://www.w3.org/TR/css3-fonts/#font-weight-prop
class ComputedFontWeightProvider extends NotReachedPropertyValueVisitor {
  private computed_font_weight_?: FontWeightValue;

  constructor() {super();}
  // TODO: Support bolder and lighter. Match the weight with font face.
// Quite often there are only a few weights available for a particular font
// family. When a weight is specified for which no face exists, a face with a
// nearby weight is used.
//   https://www.w3.org/TR/css3-fonts/#font-matching-algorithm
  VisitFontWeight(weight: FontWeightValue) {
    this.computed_font_weight_ = weight;
  }

  computed_font_weight(): FontWeightValue {
    return this.computed_font_weight_!;
  }
};

// Computed value: the percentage or "auto" or the absolute length.
//   https://www.w3.org/TR/CSS21/visudet.html#the-height-property
class ComputedHeightProvider extends NotReachedPropertyValueVisitor {
  private computed_height_?: PropertyValue;

  constructor(
    private parent_computed_height_: PropertyValue,
    private parent_computed_top_: PropertyValue,
    private parent_computed_bottom_: PropertyValue,
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
    private out_of_flow_: boolean,
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
        this.computed_height_ = keyword;
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
  VisitLength(length: LengthValue) {
    this.computed_height_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    let auto_value = KeywordValue.GetAuto();

    // If the height of the containing block is not specified explicitly
    // (i.e., it depends on content height), and this element is not absolutely
    // positioned, the value computes to "auto".
    //   https://www.w3.org/TR/CSS21/visudet.html#the-height-property
    let computed_height_ = (this.parent_computed_height_ == auto_value &&
      (this.parent_computed_top_ == auto_value ||
        this.parent_computed_bottom_ == auto_value) &&
      !this.out_of_flow_)
      ? auto_value
      : percentage;
  }

  computed_height(): PropertyValue {
    return this.computed_height_!;
  }
};

// Computed value: for length and percentage the absolute value;
//                 otherwise as specified.
//   https://www.w3.org/TR/CSS21/visudet.html#line-height
class ComputedLineHeightProvider extends NotReachedPropertyValueVisitor {
  private computed_line_height_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kNormal:
        this.computed_line_height_ = keyword;
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
      case Value.kNone:
      case Value.kNoRepeat:
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
  VisitLength(length: LengthValue) {
    this.computed_line_height_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitNumber(number: NumberValue) {
    // The computed value is the same as the specified value.
    //   https://www.w3.org/TR/CSS2/visudet.html#line-height
    this.computed_line_height_ = number;
  }
  VisitPercentage(percentage: PercentageValue) {
    // The computed value of the property is this percentage multiplied by the
    // element's computed font size. Negative values are illegal.
    //   https://www.w3.org/TR/CSS21/visudet.html#line-height
    this.computed_line_height_ = new LengthValue(
      this.computed_font_size_.value() * percentage.value(), LengthUnit.kPixelsUnit);
  }

  computed_line_height(): PropertyValue {
    return this.computed_line_height_!;
  }
};

// Computed value: the percentage as specified or the absolute length.
//   https://www.w3.org/TR/CSS21/box.html#margin-properties
//   https://www.w3.org/TR/CSS21/box.html#padding-properties
class ComputedMarginOrPaddingEdgeProvider extends NotReachedPropertyValueVisitor {
  private computed_margin_or_padding_edge_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
        this.computed_margin_or_padding_edge_ = keyword;
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
  VisitLength(length: LengthValue) {
    this.computed_margin_or_padding_edge_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    this.computed_margin_or_padding_edge_ = percentage;
  }

  computed_margin_or_padding_edge(): PropertyValue {
    return this.computed_margin_or_padding_edge_!;
  }
}

// Computed value: the percentage or "auto" or the absolute length.
//   https://www.w3.org/TR/CSS2/visudet.html#propdef-max-height
class ComputedMaxHeightProvider extends NotReachedPropertyValueVisitor {
  private computed_max_height_?: PropertyValue;
  constructor(
    private parent_computed_max_height_: PropertyValue,
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
    private out_of_flow_: boolean,
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
      case Value.kNone:
        this.computed_max_height_ = keyword;
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
  VisitLength(length: LengthValue) {
    this.computed_max_height_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    let auto_value = KeywordValue.GetAuto();
    let none_value = KeywordValue.GetNone();

    // If the max_height of the containing block is not specified explicitly
    // (i.e., it depends on content max_height), and this element is not
    // absolutely positioned, the percentage value is treated as 'none'.
    //   https://www.w3.org/TR/CSS2/visudet.html#propdef-max-height
    this.computed_max_height_ =
      (this.parent_computed_max_height_ == auto_value && !this.out_of_flow_) ? none_value
        : percentage;

  }

  computed_max_height(): PropertyValue {
    return this.computed_max_height_!;
  }
}

// Computed value: the percentage or "auto" or the absolute length.
//   https://www.w3.org/TR/CSS2/visudet.html#propdef-min-height
class ComputedMinHeightProvider extends NotReachedPropertyValueVisitor {
  private computed_min_height_?: PropertyValue;

  constructor(
    private parent_computed_height_: PropertyValue,
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
    private out_of_flow_: boolean
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
        this.computed_min_height_ = keyword;
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
  VisitLength(length: LengthValue) {
    this.computed_min_height_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    let auto_value = KeywordValue.GetAuto();

    // If the height of the containing block is not specified explicitly
    // (i.e., it depends on content height), and this element is not
    // absolutely positioned, the percentage value is treated as '0'.
    //   https://www.w3.org/TR/CSS2/visudet.html#propdef-min-height
    if (this.parent_computed_height_ == auto_value && !this.out_of_flow_) {
      this.computed_min_height_ = new LengthValue(0, LengthUnit.kPixelsUnit);
    } else {
      this.computed_min_height_ = percentage;
    }
  }

  computed_min_height(): PropertyValue {
    return this.computed_min_height_!;
  }
}

// Computed value: the percentage or "auto" as specified or the absolute length.
//   https://www.w3.org/TR/CSS2/visudet.html#min-max-widths
class ComputedMinMaxWidthProvider extends NotReachedPropertyValueVisitor {
  private computed_min_max_width_?: PropertyValue;

  constructor(
    private parent_computed_width_: PropertyValue,
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
      case Value.kNone:
        this.computed_min_max_width_ = keyword;
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
  VisitLength(length: LengthValue) {
    this.computed_min_max_width_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    let computed_length_is_negative_provider = new ComputedLengthIsNegativeProvider();
    this.parent_computed_width_.Accept(computed_length_is_negative_provider);
    // If the containing block's width is negative, the used value is zero.
    //   https://www.w3.org/TR/CSS2/visudet.html#min-max-widths
    if (computed_length_is_negative_provider.computed_length_is_negative()) {
      this.computed_min_max_width_ = new LengthValue(0, LengthUnit.kPixelsUnit);
    } else {
      this.computed_min_max_width_ = percentage;
    }
  }

  computed_min_max_width(): PropertyValue {
    return this.computed_min_max_width_!;
  }

};

// Computed value: For auto the width depends on the values of other properties.
//  https://www.w3.org/TR/CSS21/visudet.html#the-width-property
class ComputedWidthProvider extends ComputedWidthValueProvider {

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case Value.kAuto:
        this.computed_value_ = keyword;
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

class ComputedBackgroundSizeProvider extends NotReachedPropertyValueVisitor {
  private computed_background_size_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    this.computed_background_size_ = keyword;
  }
  VisitPropertyList(property_list_value: PropertyListValue) {
    let left_value_provider = new ComputedBackgroundSizeSingleValueProvider(
      this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
    property_list_value.value()[0].Accept(left_value_provider);

    let right_value_provider = new ComputedBackgroundSizeSingleValueProvider(
      this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
    property_list_value.value()[1].Accept(right_value_provider);

    let builder: PropertyListValueBuilder = new Array(2);
    builder.push(left_value_provider.computed_background_size());
    builder.push(right_value_provider.computed_background_size());
    this.computed_background_size_ = new PropertyListValue(builder.slice());
  }

  computed_background_size(): PropertyValue {
    return this.computed_background_size_!;
  }
}

//    https://www.w3.org/TR/css3-background/#border-radius
class ComputedBorderRadiusProvider extends NotReachedPropertyValueVisitor {
  private computed_border_radius_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size
  ) {super();}

  VisitLength(specified_length: LengthValue) {
    this.computed_border_radius_ =
      ProvideAbsoluteLength(specified_length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    this.computed_border_radius_ = percentage;
  }

  computed_border_radius(): PropertyValue {
    return this.computed_border_radius_!;
  }
};

// Absolutizes the value of "text-indent" property.
class ComputedTextIndentProvider extends NotReachedPropertyValueVisitor {
  private computed_text_indent_?: LengthValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size
  ) {super();}

  VisitLength(length: LengthValue) {
    this.computed_text_indent_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }

  computed_text_indent(): LengthValue {
    return this.computed_text_indent_!;
  }

};

// ComputedTransformOriginProvider provides a property list which has three
// PropertyValues. The first two PropertyValues are CalcValue to represent
// the horizontal position (or offset) and the vertical position (or offset).
// The third value always represents the Z position (or offset) and must be a
// LengthValue.
//  https://www.w3.org/TR/css3-transforms/#propdef-transform-origin
class ComputedTransformOriginProvider extends NotReachedPropertyValueVisitor {
  private computed_transform_origin_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size
  ) {super();}

  VisitPropertyList(property_list_value: PropertyListValue) {
    let size = property_list_value.value().length;
    DCHECK_GE(size, 1);
    DCHECK_LE(size, 3);

    let position_helper = new ComputedPositionHelper(
      this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
    let transform_origin_builder: PropertyListValueBuilder = new Array(3);

    // If one or two values are specified, the third value is assumed to be 0px.
    switch (size) {
      case 1:
      case 2:
        position_helper.ComputePosition(property_list_value.value(),
          transform_origin_builder);
        (transform_origin_builder)[2] = new LengthValue(0.0, LengthUnit.kPixelsUnit);
        break;
      case 3:
        position_helper.ComputeTwoValuesPosition(property_list_value.value(),
          transform_origin_builder);
        // The third value must be LengthValue type.
        (transform_origin_builder)[2] = ProvideAbsoluteLength(
          property_list_value.value()[2] as LengthValue,
          this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
        break;
    }

    this.computed_transform_origin_ =
      new PropertyListValue(transform_origin_builder.slice());
  }

  computed_transform_origin(): PropertyValue {
    return this.computed_transform_origin_!;
  }
}

class ComputedTransformProvider extends NotReachedPropertyValueVisitor {
  private computed_transform_list_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case  Value.kNone:
        this.computed_transform_list_ = keyword;
        break;

      case  Value.kAbsolute:
      case  Value.kAlternate:
      case  Value.kAlternateReverse:
      case  Value.kAuto:
      case  Value.kBackwards:
      case  Value.kBaseline:
      case  Value.kBlock:
      case  Value.kBoth:
      case  Value.kBottom:
      case  Value.kBreakWord:
      case  Value.kCenter:
      case  Value.kClip:
      case  Value.kCollapse:
      case  Value.kColumn:
      case  Value.kColumnReverse:
      case  Value.kContain:
      case  Value.kContent:
      case  Value.kCover:
      case  Value.kCurrentColor:
      case  Value.kCursive:
      case  Value.kEllipsis:
      case  Value.kEnd:
      case  Value.kEquirectangular:
      case  Value.kFantasy:
      case  Value.kFixed:
      case  Value.kFlex:
      case  Value.kFlexEnd:
      case  Value.kFlexStart:
      case  Value.kForwards:
      case  Value.kHidden:
      case  Value.kInfinite:
      case  Value.kInherit:
      case  Value.kInitial:
      case  Value.kInline:
      case  Value.kInlineBlock:
      case  Value.kInlineFlex:
      case  Value.kLeft:
      case  Value.kLineThrough:
      case  Value.kMiddle:
      case  Value.kMonoscopic:
      case  Value.kMonospace:
      case  Value.kNoRepeat:
      case  Value.kNormal:
      case  Value.kNowrap:
      case  Value.kPre:
      case  Value.kPreLine:
      case  Value.kPreWrap:
      case  Value.kRelative:
      case  Value.kRepeat:
      case  Value.kReverse:
      case  Value.kRight:
      case  Value.kRow:
      case  Value.kRowReverse:
      case  Value.kSansSerif:
      case  Value.kScroll:
      case  Value.kSerif:
      case  Value.kSolid:
      case  Value.kSpaceAround:
      case  Value.kSpaceBetween:
      case  Value.kStart:
      case  Value.kStatic:
      case  Value.kStereoscopicLeftRight:
      case  Value.kStereoscopicTopBottom:
      case  Value.kStretch:
      case  Value.kTop:
      case  Value.kUppercase:
      case  Value.kVisible:
      case  Value.kWrap:
      case  Value.kWrapReverse:
        NOTREACHED();
    }
  }
  VisitTransformPropertyValue(
    transform_property_value: TransformPropertyValue) {
// This should only ever be a TransformFunctionListValue at this point.
    let transform_function_list =
      transform_property_value as TransformFunctionListValue;
    if (!transform_function_list.value().HasTrait(
      Trait.kTraitUsesRelativeUnits)) {
      // If the transform list contains no transforms that use relative units,
      // then we do not need to do anything and we can pass through the existing
      // transform.
      this.computed_transform_list_ = transform_function_list;
    } else {
      // The transform list contains at least one transform with relative units.
      // In this case, rebuild the transform list with computed length values.
      let computed_list_builder = new TransformFunctionListValueBuilder();

      for (let transform_function of computed_list_builder) {

        let computed_transform_function_provider = new ComputedTransformFunctionProvider(
          this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
        transform_function!.Accept(computed_transform_function_provider);

        computed_list_builder.push(
          computed_transform_function_provider.PassComputedTransformFunction());
      }

      this.computed_transform_list_ =
        new TransformFunctionListValue(computed_list_builder);
    }
  }

  computed_transform_list(): PropertyValue {
    return this.computed_transform_list_!;
  }

};

class ComputedPositionOffsetProvider extends NotReachedPropertyValueVisitor {
  private computed_position_offset_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size
  ) {super();}

  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case  Value.kAuto:
        this.computed_position_offset_ = keyword;
        break;

      case  Value.kAbsolute:
      case  Value.kAlternate:
      case  Value.kAlternateReverse:
      case  Value.kBackwards:
      case  Value.kBaseline:
      case  Value.kBlock:
      case  Value.kBoth:
      case  Value.kBottom:
      case  Value.kBreakWord:
      case  Value.kCenter:
      case  Value.kClip:
      case  Value.kCollapse:
      case  Value.kColumn:
      case  Value.kColumnReverse:
      case  Value.kContain:
      case  Value.kContent:
      case  Value.kCover:
      case  Value.kCurrentColor:
      case  Value.kCursive:
      case  Value.kEllipsis:
      case  Value.kEnd:
      case  Value.kEquirectangular:
      case  Value.kFantasy:
      case  Value.kFixed:
      case  Value.kFlex:
      case  Value.kFlexEnd:
      case  Value.kFlexStart:
      case  Value.kForwards:
      case  Value.kHidden:
      case  Value.kInfinite:
      case  Value.kInherit:
      case  Value.kInitial:
      case  Value.kInline:
      case  Value.kInlineBlock:
      case  Value.kInlineFlex:
      case  Value.kLeft:
      case  Value.kLineThrough:
      case  Value.kMiddle:
      case  Value.kMonoscopic:
      case  Value.kMonospace:
      case  Value.kNone:
      case  Value.kNoRepeat:
      case  Value.kNormal:
      case  Value.kNowrap:
      case  Value.kPre:
      case  Value.kPreLine:
      case  Value.kPreWrap:
      case  Value.kRelative:
      case  Value.kRepeat:
      case  Value.kReverse:
      case  Value.kRight:
      case  Value.kRow:
      case  Value.kRowReverse:
      case  Value.kSansSerif:
      case  Value.kScroll:
      case  Value.kSerif:
      case  Value.kSolid:
      case  Value.kSpaceAround:
      case  Value.kSpaceBetween:
      case  Value.kStart:
      case  Value.kStatic:
      case  Value.kStereoscopicLeftRight:
      case  Value.kStereoscopicTopBottom:
      case  Value.kStretch:
      case  Value.kTop:
      case  Value.kUppercase:
      case  Value.kVisible:
      case  Value.kWrap:
      case  Value.kWrapReverse:
        NOTREACHED();
    }
  }
  VisitLength(length: LengthValue) {
    this.computed_position_offset_ =
      ProvideAbsoluteLength(length, this.computed_font_size_,
        this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    this.computed_position_offset_ = percentage;
  }

  computed_position_offset(): PropertyValue {
    return this.computed_position_offset_!;
  }

};

class ComputedLengthIsNegativeProvider extends DefaultingPropertyValueVisitor {
  private computed_length_is_negative_ = false;

  VisitLength(length_value: LengthValue) {
    switch (length_value.unit()) {
      case LengthUnit.kPixelsUnit:
      case LengthUnit.kFontSizesAkaEmUnit:
      case LengthUnit.kRootElementFontSizesAkaRemUnit:
      case LengthUnit.kViewportWidthPercentsAkaVwUnit:
      case LengthUnit.kViewportHeightPercentsAkaVhUnit:
        this.computed_length_is_negative_ = length_value.value() < 0;
        break;
    }
  }

  VisitDefault(property_value: PropertyValue) {
  }

  computed_length_is_negative() { return this.computed_length_is_negative_; }

};

class ComputedBackgroundSizeSingleValueProvider extends NotReachedPropertyValueVisitor {
  private computed_background_size_?: PropertyValue;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size
  ) {super();}

  VisitLength(length: LengthValue) {
    this.computed_background_size_ = ProvideAbsoluteLength(
      length, this.computed_font_size_, this.root_computed_font_size_, this.viewport_size_);
  }
  VisitPercentage(percentage: PercentageValue) {
    this.computed_background_size_ = percentage;

  }
  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case  Value.kAuto:
      case  Value.kContain:
      case  Value.kCover:
        this.computed_background_size_ = keyword;
        break;

      case  Value.kAbsolute:
      case  Value.kAlternate:
      case  Value.kAlternateReverse:
      case  Value.kBackwards:
      case  Value.kBaseline:
      case  Value.kBlock:
      case  Value.kBoth:
      case  Value.kBottom:
      case  Value.kBreakWord:
      case  Value.kCenter:
      case  Value.kClip:
      case  Value.kCollapse:
      case  Value.kColumn:
      case  Value.kColumnReverse:
      case  Value.kContent:
      case  Value.kCurrentColor:
      case  Value.kCursive:
      case  Value.kEllipsis:
      case  Value.kEnd:
      case  Value.kEquirectangular:
      case  Value.kFantasy:
      case  Value.kFixed:
      case  Value.kFlex:
      case  Value.kFlexEnd:
      case  Value.kFlexStart:
      case  Value.kForwards:
      case  Value.kHidden:
      case  Value.kInfinite:
      case  Value.kInherit:
      case  Value.kInitial:
      case  Value.kInline:
      case  Value.kInlineBlock:
      case  Value.kInlineFlex:
      case  Value.kLeft:
      case  Value.kLineThrough:
      case  Value.kMiddle:
      case  Value.kMonoscopic:
      case  Value.kMonospace:
      case  Value.kNone:
      case  Value.kNoRepeat:
      case  Value.kNormal:
      case  Value.kNowrap:
      case  Value.kPre:
      case  Value.kPreLine:
      case  Value.kPreWrap:
      case  Value.kRelative:
      case  Value.kRepeat:
      case  Value.kReverse:
      case  Value.kRight:
      case  Value.kRow:
      case  Value.kRowReverse:
      case  Value.kSansSerif:
      case  Value.kScroll:
      case  Value.kSerif:
      case  Value.kSolid:
      case  Value.kSpaceAround:
      case  Value.kSpaceBetween:
      case  Value.kStart:
      case  Value.kStatic:
      case  Value.kStereoscopicLeftRight:
      case  Value.kStereoscopicTopBottom:
      case  Value.kStretch:
      case  Value.kTop:
      case  Value.kUppercase:
      case  Value.kVisible:
      case  Value.kWrap:
      case  Value.kWrapReverse:
        NOTREACHED();
    }
  }

  computed_background_size(): PropertyValue {
    return this.computed_background_size_!;
  }
};

// Computed value: for length of translation transforms.
//   https://www.w3.org/TR/css3-transforms/#propdef-transform
class ComputedTransformFunctionProvider extends TransformFunctionVisitor {
  private computed_transform_function_?: TransformFunction;

  constructor(
    private computed_font_size_: LengthValue,
    private root_computed_font_size_: LengthValue,
    private viewport_size_: Size,
  ) {super();}

  VisitMatrix(matrix_function: MatrixFunction) {
    this.computed_transform_function_ = matrix_function;
  }
  VisitRotate(rotate_function: RotateFunction) {
    this.computed_transform_function_ = rotate_function;
  }
  VisitScale(scale_function: ScaleFunction) {
    this.computed_transform_function_ = scale_function;
  }
  VisitTranslate(translate_function: TranslateFunction) {
    this.computed_transform_function_ = translate_function;
  }

  PassComputedTransformFunction(): TransformFunction {
    return this.computed_transform_function_!;
  }
};
