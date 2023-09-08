import { GetPropertyKey, GetPropertyName, PropertyKey } from './property_definitions';

export interface CobaltCSSStyleDeclaration {
  alignContent: string;
  alignItems: string;
  alignSelf: string;
  // alignmentBaseline: string;
  // all: string;
  // animation: string;
  // animationDelay: string;
  // animationDirection: string;
  // animationDuration: string;
  // animationFillMode: string;
  // animationIterationCount: string;
  // animationName: string;
  // animationPlayState: string;
  // animationTimingFunction: string;
  // appearance: string;
  // aspectRatio: string;
  // backfaceVisibility: string;
  background: string;
  // backgroundAttachment: string;
  // backgroundBlendMode: string;
  // backgroundClip: string;
  // backgroundColor: string;
  // backgroundImage: string;
  // backgroundOrigin: string;
  // backgroundPosition: string;
  // backgroundPositionX: string;
  // backgroundPositionY: string;
  // backgroundRepeat: string;
  // backgroundSize: string;
  // baselineShift: string;
  // blockSize: string;
  // border: string;
  // borderBlock: string;
  // borderBlockColor: string;
  // borderBlockEnd: string;
  // borderBlockEndColor: string;
  // borderBlockEndStyle: string;
  // borderBlockEndWidth: string;
  // borderBlockStart: string;
  // borderBlockStartColor: string;
  // borderBlockStartStyle: string;
  // borderBlockStartWidth: string;
  // borderBlockStyle: string;
  // borderBlockWidth: string;
  // borderBottom: string;
  // borderBottomColor: string;
  // borderBottomLeftRadius: string;
  // borderBottomRightRadius: string;
  // borderBottomStyle: string;
  // borderBottomWidth: string;
  // borderCollapse: string;
  // borderColor: string;
  // borderEndEndRadius: string;
  // borderEndStartRadius: string;
  // borderImage: string;
  // borderImageOutset: string;
  // borderImageRepeat: string;
  // borderImageSlice: string;
  // borderImageSource: string;
  // borderImageWidth: string;
  // borderInline: string;
  // borderInlineColor: string;
  // borderInlineEnd: string;
  // borderInlineEndColor: string;
  // borderInlineEndStyle: string;
  // borderInlineEndWidth: string;
  // borderInlineStart: string;
  // borderInlineStartColor: string;
  // borderInlineStartStyle: string;
  // borderInlineStartWidth: string;
  // borderInlineStyle: string;
  // borderInlineWidth: string;
  // borderLeft: string;
  // borderLeftColor: string;
  // borderLeftStyle: string;
  // borderLeftWidth: string;
  // borderRadius: string;
  // borderRight: string;
  // borderRightColor: string;
  // borderRightStyle: string;
  // borderRightWidth: string;
  // borderSpacing: string;
  // borderStartEndRadius: string;
  // borderStartStartRadius: string;
  // borderStyle: string;
  // borderTop: string;
  // borderTopColor: string;
  // borderTopLeftRadius: string;
  // borderTopRightRadius: string;
  // borderTopStyle: string;
  // borderTopWidth: string;
  // borderWidth: string;
  // bottom: string;
  // boxShadow: string;
  // boxSizing: string;
  // breakAfter: string;
  // breakBefore: string;
  // breakInside: string;
  // captionSide: string;
  // caretColor: string;
  // clear: string;
  // /** @deprecated */
  // clip: string;
  // clipPath: string;
  // clipRule: string;
  // color: string;
  // colorInterpolation: string;
  // colorInterpolationFilters: string;
  // colorScheme: string;
  // columnCount: string;
  // columnFill: string;
  // columnGap: string;
  // columnRule: string;
  // columnRuleColor: string;
  // columnRuleStyle: string;
  // columnRuleWidth: string;
  // columnSpan: string;
  // columnWidth: string;
  // columns: string;
  // contain: string;
  // content: string;
  // counterIncrement: string;
  // counterReset: string;
  // counterSet: string;
  // cssFloat: string;
  // cssText: string;
  // cursor: string;
  // direction: string;
  // display: string;
  // dominantBaseline: string;
  // emptyCells: string;
  // fill: string;
  // fillOpacity: string;
  // fillRule: string;
  // filter: string;
  // flex: string;
  // flexBasis: string;
  // flexDirection: string;
  // flexFlow: string;
  // flexGrow: string;
  // flexShrink: string;
  // flexWrap: string;
  // float: string;
  // floodColor: string;
  // floodOpacity: string;
  // font: string;
  // fontFamily: string;
  // fontFeatureSettings: string;
  // fontKerning: string;
  // fontOpticalSizing: string;
  // fontSize: string;
  // fontSizeAdjust: string;
  // fontStretch: string;
  // fontStyle: string;
  // fontSynthesis: string;
  // fontVariant: string;
  // /** @deprecated */
  // fontVariantAlternates: string;
  // fontVariantCaps: string;
  // fontVariantEastAsian: string;
  // fontVariantLigatures: string;
  // fontVariantNumeric: string;
  // fontVariantPosition: string;
  // fontVariationSettings: string;
  // fontWeight: string;
  // gap: string;
  // grid: string;
  // gridArea: string;
  // gridAutoColumns: string;
  // gridAutoFlow: string;
  // gridAutoRows: string;
  // gridColumn: string;
  // gridColumnEnd: string;
  // gridColumnGap: string;
  // gridColumnStart: string;
  // gridGap: string;
  // gridRow: string;
  // gridRowEnd: string;
  // gridRowGap: string;
  // gridRowStart: string;
  // gridTemplate: string;
  // gridTemplateAreas: string;
  // gridTemplateColumns: string;
  // gridTemplateRows: string;
  // height: string;
  // hyphens: string;
  // /** @deprecated */
  // imageOrientation: string;
  // imageRendering: string;
  // inlineSize: string;
  // inset: string;
  // insetBlock: string;
  // insetBlockEnd: string;
  // insetBlockStart: string;
  // insetInline: string;
  // insetInlineEnd: string;
  // insetInlineStart: string;
  // isolation: string;
  // justifyContent: string;
  // justifyItems: string;
  // justifySelf: string;
  // left: string;
  // readonly length: number;
  // letterSpacing: string;
  // lightingColor: string;
  // lineBreak: string;
  // lineHeight: string;
  // listStyle: string;
  // listStyleImage: string;
  // listStylePosition: string;
  // listStyleType: string;
  // margin: string;
  // marginBlock: string;
  // marginBlockEnd: string;
  // marginBlockStart: string;
  // marginBottom: string;
  // marginInline: string;
  // marginInlineEnd: string;
  // marginInlineStart: string;
  // marginLeft: string;
  // marginRight: string;
  // marginTop: string;
  // marker: string;
  // markerEnd: string;
  // markerMid: string;
  // markerStart: string;
  // mask: string;
  // maskType: string;
  // maxBlockSize: string;
  // maxHeight: string;
  // maxInlineSize: string;
  // maxWidth: string;
  // minBlockSize: string;
  // minHeight: string;
  // minInlineSize: string;
  // minWidth: string;
  // mixBlendMode: string;
  // objectFit: string;
  // objectPosition: string;
  // offset: string;
  // offsetAnchor: string;
  // offsetDistance: string;
  // offsetPath: string;
  // offsetRotate: string;
  // opacity: string;
  // order: string;
  // orphans: string;
  // outline: string;
  // outlineColor: string;
  // outlineOffset: string;
  // outlineStyle: string;
  // outlineWidth: string;
  // overflow: string;
  // overflowAnchor: string;
  // overflowWrap: string;
  // overflowX: string;
  // overflowY: string;
  // overscrollBehavior: string;
  // overscrollBehaviorBlock: string;
  // overscrollBehaviorInline: string;
  // overscrollBehaviorX: string;
  // overscrollBehaviorY: string;
  // padding: string;
  // paddingBlock: string;
  // paddingBlockEnd: string;
  // paddingBlockStart: string;
  // paddingBottom: string;
  // paddingInline: string;
  // paddingInlineEnd: string;
  // paddingInlineStart: string;
  // paddingLeft: string;
  // paddingRight: string;
  // paddingTop: string;
  // pageBreakAfter: string;
  // pageBreakBefore: string;
  // pageBreakInside: string;
  // paintOrder: string;
  // readonly parentRule: CSSRule | null;
  // perspective: string;
  // perspectiveOrigin: string;
  // placeContent: string;
  // placeItems: string;
  // placeSelf: string;
  // pointerEvents: string;
  // position: string;
  // quotes: string;
  // resize: string;
  // right: string;
  // rotate: string;
  // rowGap: string;
  // rubyPosition: string;
  // scale: string;
  // scrollBehavior: string;
  // scrollMargin: string;
  // scrollMarginBlock: string;
  // scrollMarginBlockEnd: string;
  // scrollMarginBlockStart: string;
  // scrollMarginBottom: string;
  // scrollMarginInline: string;
  // scrollMarginInlineEnd: string;
  // scrollMarginInlineStart: string;
  // scrollMarginLeft: string;
  // scrollMarginRight: string;
  // scrollMarginTop: string;
  // scrollPadding: string;
  // scrollPaddingBlock: string;
  // scrollPaddingBlockEnd: string;
  // scrollPaddingBlockStart: string;
  // scrollPaddingBottom: string;
  // scrollPaddingInline: string;
  // scrollPaddingInlineEnd: string;
  // scrollPaddingInlineStart: string;
  // scrollPaddingLeft: string;
  // scrollPaddingRight: string;
  // scrollPaddingTop: string;
  // scrollSnapAlign: string;
  // scrollSnapStop: string;
  // scrollSnapType: string;
  // shapeImageThreshold: string;
  // shapeMargin: string;
  // shapeOutside: string;
  // shapeRendering: string;
  // stopColor: string;
  // stopOpacity: string;
  // stroke: string;
  // strokeDasharray: string;
  // strokeDashoffset: string;
  // strokeLinecap: string;
  // strokeLinejoin: string;
  // strokeMiterlimit: string;
  // strokeOpacity: string;
  // strokeWidth: string;
  // tabSize: string;
  // tableLayout: string;
  // textAlign: string;
  // textAlignLast: string;
  // textAnchor: string;
  // textCombineUpright: string;
  // textDecoration: string;
  // textDecorationColor: string;
  // textDecorationLine: string;
  // textDecorationSkipInk: string;
  // textDecorationStyle: string;
  // textDecorationThickness: string;
  // textEmphasis: string;
  // textEmphasisColor: string;
  // textEmphasisPosition: string;
  // textEmphasisStyle: string;
  // textIndent: string;
  // textOrientation: string;
  // textOverflow: string;
  // textRendering: string;
  // textShadow: string;
  // textTransform: string;
  // textUnderlineOffset: string;
  // textUnderlinePosition: string;
  // top: string;
  // touchAction: string;
  // transform: string;
  // transformBox: string;
  // transformOrigin: string;
  // transformStyle: string;
  // transition: string;
  // transitionDelay: string;
  // transitionDuration: string;
  // transitionProperty: string;
  // transitionTimingFunction: string;
  // translate: string;
  // unicodeBidi: string;
  // userSelect: string;
  // verticalAlign: string;
  // visibility: string;
  // /** @deprecated This is a legacy alias of `alignContent`. */
  // webkitAlignContent: string;
  // /** @deprecated This is a legacy alias of `alignItems`. */
  // webkitAlignItems: string;
  // /** @deprecated This is a legacy alias of `alignSelf`. */
  // webkitAlignSelf: string;
  // /** @deprecated This is a legacy alias of `animation`. */
  // webkitAnimation: string;
  // /** @deprecated This is a legacy alias of `animationDelay`. */
  // webkitAnimationDelay: string;
  // /** @deprecated This is a legacy alias of `animationDirection`. */
  // webkitAnimationDirection: string;
  // /** @deprecated This is a legacy alias of `animationDuration`. */
  // webkitAnimationDuration: string;
  // /** @deprecated This is a legacy alias of `animationFillMode`. */
  // webkitAnimationFillMode: string;
  // /** @deprecated This is a legacy alias of `animationIterationCount`. */
  // webkitAnimationIterationCount: string;
  // /** @deprecated This is a legacy alias of `animationName`. */
  // webkitAnimationName: string;
  // /** @deprecated This is a legacy alias of `animationPlayState`. */
  // webkitAnimationPlayState: string;
  // /** @deprecated This is a legacy alias of `animationTimingFunction`. */
  // webkitAnimationTimingFunction: string;
  // /** @deprecated This is a legacy alias of `appearance`. */
  // webkitAppearance: string;
  // /** @deprecated This is a legacy alias of `backfaceVisibility`. */
  // webkitBackfaceVisibility: string;
  // /** @deprecated This is a legacy alias of `backgroundClip`. */
  // webkitBackgroundClip: string;
  // /** @deprecated This is a legacy alias of `backgroundOrigin`. */
  // webkitBackgroundOrigin: string;
  // /** @deprecated This is a legacy alias of `backgroundSize`. */
  // webkitBackgroundSize: string;
  // /** @deprecated This is a legacy alias of `borderBottomLeftRadius`. */
  // webkitBorderBottomLeftRadius: string;
  // /** @deprecated This is a legacy alias of `borderBottomRightRadius`. */
  // webkitBorderBottomRightRadius: string;
  // /** @deprecated This is a legacy alias of `borderRadius`. */
  // webkitBorderRadius: string;
  // /** @deprecated This is a legacy alias of `borderTopLeftRadius`. */
  // webkitBorderTopLeftRadius: string;
  // /** @deprecated This is a legacy alias of `borderTopRightRadius`. */
  // webkitBorderTopRightRadius: string;
  // /** @deprecated */
  // webkitBoxAlign: string;
  // /** @deprecated */
  // webkitBoxFlex: string;
  // /** @deprecated */
  // webkitBoxOrdinalGroup: string;
  // /** @deprecated */
  // webkitBoxOrient: string;
  // /** @deprecated */
  // webkitBoxPack: string;
  // /** @deprecated This is a legacy alias of `boxShadow`. */
  // webkitBoxShadow: string;
  // /** @deprecated This is a legacy alias of `boxSizing`. */
  // webkitBoxSizing: string;
  // /** @deprecated This is a legacy alias of `filter`. */
  // webkitFilter: string;
  // /** @deprecated This is a legacy alias of `flex`. */
  // webkitFlex: string;
  // /** @deprecated This is a legacy alias of `flexBasis`. */
  // webkitFlexBasis: string;
  // /** @deprecated This is a legacy alias of `flexDirection`. */
  // webkitFlexDirection: string;
  // /** @deprecated This is a legacy alias of `flexFlow`. */
  // webkitFlexFlow: string;
  // /** @deprecated This is a legacy alias of `flexGrow`. */
  // webkitFlexGrow: string;
  // /** @deprecated This is a legacy alias of `flexShrink`. */
  // webkitFlexShrink: string;
  // /** @deprecated This is a legacy alias of `flexWrap`. */
  // webkitFlexWrap: string;
  // /** @deprecated This is a legacy alias of `justifyContent`. */
  // webkitJustifyContent: string;
  // webkitLineClamp: string;
  // /** @deprecated This is a legacy alias of `mask`. */
  // webkitMask: string;
  // /** @deprecated This is a legacy alias of `maskBorder`. */
  // webkitMaskBoxImage: string;
  // /** @deprecated This is a legacy alias of `maskBorderOutset`. */
  // webkitMaskBoxImageOutset: string;
  // /** @deprecated This is a legacy alias of `maskBorderRepeat`. */
  // webkitMaskBoxImageRepeat: string;
  // /** @deprecated This is a legacy alias of `maskBorderSlice`. */
  // webkitMaskBoxImageSlice: string;
  // /** @deprecated This is a legacy alias of `maskBorderSource`. */
  // webkitMaskBoxImageSource: string;
  // /** @deprecated This is a legacy alias of `maskBorderWidth`. */
  // webkitMaskBoxImageWidth: string;
  // /** @deprecated This is a legacy alias of `maskClip`. */
  // webkitMaskClip: string;
  // webkitMaskComposite: string;
  // /** @deprecated This is a legacy alias of `maskImage`. */
  // webkitMaskImage: string;
  // /** @deprecated This is a legacy alias of `maskOrigin`. */
  // webkitMaskOrigin: string;
  // /** @deprecated This is a legacy alias of `maskPosition`. */
  // webkitMaskPosition: string;
  // /** @deprecated This is a legacy alias of `maskRepeat`. */
  // webkitMaskRepeat: string;
  // /** @deprecated This is a legacy alias of `maskSize`. */
  // webkitMaskSize: string;
  // /** @deprecated This is a legacy alias of `order`. */
  // webkitOrder: string;
  // /** @deprecated This is a legacy alias of `perspective`. */
  // webkitPerspective: string;
  // /** @deprecated This is a legacy alias of `perspectiveOrigin`. */
  // webkitPerspectiveOrigin: string;
  // webkitTextFillColor: string;
  // webkitTextStroke: string;
  // webkitTextStrokeColor: string;
  // webkitTextStrokeWidth: string;
  // /** @deprecated This is a legacy alias of `transform`. */
  // webkitTransform: string;
  // /** @deprecated This is a legacy alias of `transformOrigin`. */
  // webkitTransformOrigin: string;
  // /** @deprecated This is a legacy alias of `transformStyle`. */
  // webkitTransformStyle: string;
  // /** @deprecated This is a legacy alias of `transition`. */
  // webkitTransition: string;
  // /** @deprecated This is a legacy alias of `transitionDelay`. */
  // webkitTransitionDelay: string;
  // /** @deprecated This is a legacy alias of `transitionDuration`. */
  // webkitTransitionDuration: string;
  // /** @deprecated This is a legacy alias of `transitionProperty`. */
  // webkitTransitionProperty: string;
  // /** @deprecated This is a legacy alias of `transitionTimingFunction`. */
  // webkitTransitionTimingFunction: string;
  // /** @deprecated This is a legacy alias of `userSelect`. */
  // webkitUserSelect: string;
  // whiteSpace: string;
  // widows: string;
  // width: string;
  // willChange: string;
  // wordBreak: string;
  // wordSpacing: string;
  // /** @deprecated */
  // wordWrap: string;
  // writingMode: string;
  // zIndex: string;
  // getPropertyPriority(property: string): string;
  // getPropertyValue(property: string): string;
  // item(index: number): string;
  // removeProperty(property: string): string;
  // setProperty(property: string, value: string | null, priority?: string): void;
  // [index: number]: string;
}

export abstract class StyleDeclaration implements CobaltCSSStyleDeclaration {
  abstract GetDeclaredPropertyValueStringByKey(key: PropertyKey): string
  abstract setProperty(property_name: string, property_value: string): void
  removeProperty(property_name: string): void {
    const retval = this.GetPropertyValue(property_name);
    if (retval) {
      this.setProperty(property_name, '');
    }
  }
  GetPropertyValue(property_name: string): string {
    return this.GetDeclaredPropertyValueStringByKey(GetPropertyKey(property_name));
  }
  SetPropertyValueStringByKey(key: PropertyKey, property_value: string) {
    this.setProperty(GetPropertyName(key), property_value);
  }

  get alignContent() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAlignContentProperty);
  }
  set alignContent(align_content) {
    this.SetPropertyValueStringByKey(PropertyKey.kAlignContentProperty, align_content,);
  }

  get alignItems() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAlignItemsProperty);
  }
  set alignItems(
    align_items) {
    this.SetPropertyValueStringByKey(PropertyKey.kAlignItemsProperty, align_items,
    );
  }

  get alignSelf() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAlignSelfProperty);
  }
  set alignSelf(
    align_self) {
    this.SetPropertyValueStringByKey(PropertyKey.kAlignSelfProperty, align_self,);
  }

  // get animation() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationProperty);
  // }
  //
  // set animation(
  //   animation) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationProperty, animation,);
  // }
  //
  // get animation_delay() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationDelayProperty);
  // }
  //
  // set animation_delay(
  //   animation_delay,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationDelayProperty, animation_delay,
  //   );
  // }
  //
  // get animation_direction() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationDirectionProperty);
  // }
  //
  // set animation_direction(
  //   animation_direction,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationDirectionProperty, animation_direction,
  //   );
  // }
  //
  // get animation_duration() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationDurationProperty);
  // }
  //
  // set animation_duration(
  //   animation_duration,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationDurationProperty, animation_duration,
  //   );
  // }
  //
  // get animation_fill_mode() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationFillModeProperty);
  // }
  //
  // set animation_fill_mode(
  //   animation_fill_mode,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationFillModeProperty, animation_fill_mode,
  //   );
  // }
  //
  // get animation_iteration_count() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationIterationCountProperty);
  // }
  //
  // set animation_iteration_count(
  //   animation_iteration_count,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationIterationCountProperty,
  //     animation_iteration_count,);
  // }
  //
  // get animation_name() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationNameProperty);
  // }
  //
  // set animation_name(
  //   animation_name,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationNameProperty, animation_name,
  //   );
  // }
  //
  // get animation_timing_function() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kAnimationTimingFunctionProperty);
  // }
  //
  // set animation_timing_function(
  //   animation_timing_function,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kAnimationTimingFunctionProperty,
  //     animation_timing_function,);
  // }

  get background() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBackgroundProperty);
  }

  set background(
    background) {
    this.SetPropertyValueStringByKey(PropertyKey.kBackgroundProperty, background,);
  }

  get backgroundColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBackgroundColorProperty);
  }
  set backgroundColor(
    background_color,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBackgroundColorProperty, background_color,
    );
  }

  get backgroundImage() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBackgroundImageProperty);
  }
  set backgroundImage(
    background_image,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBackgroundImageProperty, background_image,
    );
  }

  get backgroundPosition() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBackgroundPositionProperty);
  }
  set backgroundPosition(
    background_position,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBackgroundPositionProperty, background_position,
    );
  }

  get backgroundRepeat() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBackgroundRepeatProperty);
  }
  set backgroundRepeat(
    background_repeat,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBackgroundRepeatProperty, background_repeat,
    );
  }

  get backgroundSize() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBackgroundSizeProperty);
  }
  set backgroundSize(
    background_size,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBackgroundSizeProperty, background_size,
    );
  }

  get border() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderProperty);
  }

  set border(border,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderProperty, border,);
  }

  get borderBottom() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderBottomProperty);
  }
  set borderBottom(
    border_bottom) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderBottomProperty, border_bottom,
    );
  }

  get borderLeft() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderLeftProperty);
  }
  set borderLeft(
    border_left) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderLeftProperty, border_left,
    );
  }

  get borderRight() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderRightProperty);
  }
  set borderRight(
    border_right) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderRightProperty, border_right,
    );
  }

  get borderTop() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderTopProperty);
  }
  set borderTop(
    border_top) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderTopProperty, border_top,);
  }

  get borderColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderColorProperty);
  }
  set borderColor(
    border_color) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderColorProperty, border_color,
    );
  }

  get borderTopColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderTopColorProperty);
  }
  set borderTopColor(
    border_top_color,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderTopColorProperty, border_top_color,
    );
  }

  get borderRightColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderRightColorProperty);
  }
  set borderRightColor(
    border_right_color,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderRightColorProperty, border_right_color,
    );
  }

  get borderBottomColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderBottomColorProperty);
  }
  set borderBottomColor(
    border_bottom_color,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderBottomColorProperty, border_bottom_color,
    );
  }

  get borderLeftColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderLeftColorProperty);
  }
  set borderLeftColor(
    border_left_color,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderLeftColorProperty, border_left_color,
    );
  }

  get borderStyle() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderStyleProperty);
  }
  set borderStyle(
    border_style) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderStyleProperty, border_style,
    );
  }

  get borderTopStyle() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderTopStyleProperty);
  }
  set borderTopStyle(
    border_top_style,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderTopStyleProperty, border_top_style,
    );
  }

  get borderRightStyle() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderRightStyleProperty);
  }
  set borderRightStyle(
    border_right_style,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderRightStyleProperty, border_right_style,
    );
  }

  get borderBottomStyle() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderBottomStyleProperty);
  }
  set borderBottomStyle(
    border_bottom_style,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderBottomStyleProperty, border_bottom_style,
    );
  }

  get borderLeftStyle() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderLeftStyleProperty);
  }
  set borderLeftStyle(
    border_left_style,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderLeftStyleProperty, border_left_style,
    );
  }

  get borderWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderWidthProperty);
  }
  set borderWidth(
    border_width) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderWidthProperty, border_width,
    );
  }

  get borderTopWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderTopWidthProperty);
  }
  set borderTopWidth(
    border_top_width,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderTopWidthProperty, border_top_width,
    );
  }

  get borderRightWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderRightWidthProperty);
  }
  set borderRightWidth(
    border_right_width,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderRightWidthProperty, border_right_width,
    );
  }

  get borderBottomWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderBottomWidthProperty);
  }
  set borderBottomWidth(
    border_bottom_width,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderBottomWidthProperty, border_bottom_width,
    );
  }

  get borderLeftWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderLeftWidthProperty);
  }
  set borderLeftWidth(
    border_left_width,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderLeftWidthProperty, border_left_width,
    );
  }

  get borderRadius() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderRadiusProperty);
  }
  set borderRadius(
    border_radius) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderRadiusProperty, border_radius,
    );
  }

  get borderTopLeftRadius() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderTopLeftRadiusProperty);
  }
  set borderTopLeftRadius(
    border_top_left_radius,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderTopLeftRadiusProperty,
      border_top_left_radius,);
  }

  get borderTopRightRadius() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderTopRightRadiusProperty);
  }
  set borderTopRightRadius(
    border_top_right_radius,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderTopRightRadiusProperty,
      border_top_right_radius,);
  }

  get borderBottomRightRadius() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderBottomRightRadiusProperty);
  }
  set borderBottomRightRadius(
    border_bottom_right_radius,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderBottomRightRadiusProperty,
      border_bottom_right_radius,);
  }

  get borderBottomLeftradius() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBorderBottomLeftRadiusProperty);
  }
  set borderBottomLeftradius(
    border_bottom_left_radius,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBorderBottomLeftRadiusProperty,
      border_bottom_left_radius,);
  }

  get bottom() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBottomProperty);
  }

  set bottom(bottom,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kBottomProperty, bottom,);
  }

  get boxShadow() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kBoxShadowProperty);
  }
  set boxShadow(
    box_shadow) {
    this.SetPropertyValueStringByKey(PropertyKey.kBoxShadowProperty, box_shadow,);
  }

  get color() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kColorProperty);
  }
  set color(color,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kColorProperty, color,);
  }

  get content() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kContentProperty);
  }
  set content(content,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kContentProperty, content,);
  }

  get display() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kDisplayProperty);
  }
  set display(display,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kDisplayProperty, display,);
  }

  get filter() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFilterProperty);
  }
  set filter(filter,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kFilterProperty, filter,);
  }

  get flex() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFlexProperty);
  }
  set flex(flex,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kFlexProperty, flex,);
  }

  get flexBasis() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFlexBasisProperty);
  }
  set flexBasis(
    flex_basis) {
    this.SetPropertyValueStringByKey(PropertyKey.kFlexBasisProperty, flex_basis,);
  }

  get flexDirection() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFlexDirectionProperty);
  }
  set flexDirection(
    flex_direction,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kFlexDirectionProperty, flex_direction,
    );
  }

  get flexFlow() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFlexFlowProperty);
  }
  set flexFlow(
    flex_flow) {
    this.SetPropertyValueStringByKey(PropertyKey.kFlexFlowProperty, flex_flow,);
  }

  get flexGrow() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFlexGrowProperty);
  }
  set flexGrow(
    flex_grow) {
    this.SetPropertyValueStringByKey(PropertyKey.kFlexGrowProperty, flex_grow,);
  }

  get flexShrink() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFlexShrinkProperty);
  }

  set flexShrink(
    flex_shrink) {
    this.SetPropertyValueStringByKey(PropertyKey.kFlexShrinkProperty, flex_shrink,
    );
  }

  get flexWrap() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFlexWrapProperty);
  }

  set flexWrap(
    flex_wrap) {
    this.SetPropertyValueStringByKey(PropertyKey.kFlexWrapProperty, flex_wrap,);
  }

  get font() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFontProperty);
  }

  set font(font,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kFontProperty, font,);
  }

  get fontFamily() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFontFamilyProperty);
  }

  set fontFamily(
    font_family) {
    this.SetPropertyValueStringByKey(PropertyKey.kFontFamilyProperty, font_family,
    );
  }

  get fontSize() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFontSizeProperty);
  }

  set fontSize(
    font_size) {
    this.SetPropertyValueStringByKey(PropertyKey.kFontSizeProperty, font_size,);
  }

  get fontStyle() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFontStyleProperty);
  }

  set fontStyle(
    font_style) {
    this.SetPropertyValueStringByKey(PropertyKey.kFontStyleProperty, font_style,);
  }

  get fontWeight() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kFontWeightProperty);
  }

  set fontWeight(
    font_weight) {
    this.SetPropertyValueStringByKey(PropertyKey.kFontWeightProperty, font_weight,
    );
  }

  get height() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kHeightProperty);
  }

  set height(height,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kHeightProperty, height,);
  }

  get justifyContent() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kJustifyContentProperty);
  }

  set justifyContent(
    justify_content,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kJustifyContentProperty, justify_content,
    );
  }

  get left() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kLeftProperty);
  }

  set left(left,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kLeftProperty, left,);
  }

  get lineHeight() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kLineHeightProperty);
  }

  set lineHeight(
    line_height) {
    this.SetPropertyValueStringByKey(PropertyKey.kLineHeightProperty, line_height,
    );
  }

  get margin() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMarginProperty);
  }

  set margin(margin,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kMarginProperty, margin,);
  }

  get marginBottom() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMarginBottomProperty);
  }

  set marginBottom(
    margin_bottom) {
    this.SetPropertyValueStringByKey(PropertyKey.kMarginBottomProperty, margin_bottom,
    );
  }

  get marginLeft() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMarginLeftProperty);
  }

  set marginLeft(
    margin_left) {
    this.SetPropertyValueStringByKey(PropertyKey.kMarginLeftProperty, margin_left,
    );
  }

  get marginRight() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMarginRightProperty);
  }

  set marginRight(
    margin_right) {
    this.SetPropertyValueStringByKey(PropertyKey.kMarginRightProperty, margin_right,
    );
  }

  get marginTop() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMarginTopProperty);
  }

  set marginTop(
    margin_top) {
    this.SetPropertyValueStringByKey(PropertyKey.kMarginTopProperty, margin_top,);
  }

  get maxHeight() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMaxHeightProperty);
  }

  set maxHeight(
    max_height) {
    this.SetPropertyValueStringByKey(PropertyKey.kMaxHeightProperty, max_height,);
  }

  get maxWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMaxWidthProperty);
  }

  set maxWidth(
    max_width) {
    this.SetPropertyValueStringByKey(PropertyKey.kMaxWidthProperty, max_width,);
  }

  get minHeight() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMinHeightProperty);
  }
  set minHeight(
    min_height) {
    this.SetPropertyValueStringByKey(PropertyKey.kMinHeightProperty, min_height,);
  }

  get minWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kMinWidthProperty);
  }
  set minWidth(
    min_width) {
    this.SetPropertyValueStringByKey(PropertyKey.kMinWidthProperty, min_width,);
  }

  get opacity() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOpacityProperty);
  }
  set opacity(opacity,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kOpacityProperty, opacity,);
  }

  get order() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOrderProperty);
  }
  set order(order,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kOrderProperty, order,);
  }

  get outline() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOutlineProperty);
  }
  set outline(outline,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kOutlineProperty, outline,);
  }

  get outlineColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOutlineColorProperty);
  }
  set outlineColor(
    outline_color) {
    this.SetPropertyValueStringByKey(PropertyKey.kOutlineColorProperty, outline_color,
    );
  }

  get outlineStyle() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOutlineStyleProperty);
  }
  set outlineStyle(
    outline_style) {
    this.SetPropertyValueStringByKey(PropertyKey.kOutlineStyleProperty, outline_style,
    );
  }

  get outlineWidth() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOutlineWidthProperty);
  }
  set outlineWidth(
    outline_width) {
    this.SetPropertyValueStringByKey(PropertyKey.kOutlineWidthProperty, outline_width,
    );
  }

  get overflow() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOverflowProperty);
  }

  set overflow(
    overflow) {
    this.SetPropertyValueStringByKey(PropertyKey.kOverflowProperty, overflow,);
  }

  get overflowWrap() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOverflowWrapProperty);
  }
  set overflowWrap(
    overflow_wrap) {
    this.SetPropertyValueStringByKey(PropertyKey.kOverflowWrapProperty, overflow_wrap,
    );
  }

  get padding() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kPaddingProperty);
  }

  set padding(padding,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kPaddingProperty, padding,);
  }

  get paddingBottom() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kPaddingBottomProperty);
  }
  set paddingBottom(
    padding_bottom,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kPaddingBottomProperty, padding_bottom,
    );
  }

  get paddingLeft() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kPaddingLeftProperty);
  }
  set paddingLeft(
    padding_left) {
    this.SetPropertyValueStringByKey(PropertyKey.kPaddingLeftProperty, padding_left,
    );
  }

  get paddingRight() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kPaddingRightProperty);
  }
  set paddingRight(
    padding_right) {
    this.SetPropertyValueStringByKey(PropertyKey.kPaddingRightProperty, padding_right,
    );
  }

  get paddingTop() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kPaddingTopProperty);
  }
  set paddingTop(
    padding_top) {
    this.SetPropertyValueStringByKey(PropertyKey.kPaddingTopProperty, padding_top,
    );
  }

  get pointerEvents() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kPointerEventsProperty);
  }
  set pointerEvents(
    pointer_events,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kPointerEventsProperty, pointer_events,
    );
  }

  get position() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kPositionProperty);
  }
  set position(
    position) {
    this.SetPropertyValueStringByKey(PropertyKey.kPositionProperty, position,);
  }

  get right() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kRightProperty);
  }

  set right(right,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kRightProperty, right,);
  }

  get textAlign() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextAlignProperty);
  }
  set textAlign(
    text_align) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextAlignProperty, text_align,);
  }

  get textDecoration() {
    // TODO: Redirect text decoration to text decoration line for now and
    // change it when fully implement text decoration.
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextDecorationLineProperty);
  }
  set textDecoration(
    text_decoration,
  ) {
    // TODO: Redirect text decoration to text decoration line for now and
    // change it when fully implement text decoration.
    this.SetPropertyValueStringByKey(PropertyKey.kTextDecorationLineProperty, text_decoration,
    );
  }

  get textDecorationColor() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextDecorationColorProperty);
  }
  set textDecorationColor(
    text_decoration_color,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextDecorationColorProperty,
      text_decoration_color,);
  }

  get textDecorationLine() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextDecorationLineProperty);
  }
  set textDecorationLine(
    text_decoration_line,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextDecorationLineProperty, text_decoration_line,
    );
  }

  get textIndent() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextIndentProperty);
  }
  set textIndent(
    text_indent) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextIndentProperty, text_indent,
    );
  }

  get textOverflow() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextOverflowProperty);
  }
  set textOverflow(
    text_overflow) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextOverflowProperty, text_overflow,
    );
  }

  get textPath() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextPathProperty);
  }
  set textPath(text_path) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextPathProperty, text_path,);
  }

  get textShadow() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextShadowProperty);
  }
  set textShadow(
    text_shadow) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextShadowProperty, text_shadow,
    );
  }

  get textTransform() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTextTransformProperty);
  }
  set textTransform(
    text_transform,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kTextTransformProperty, text_transform,
    );
  }

  get top() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTopProperty);
  }
  set top(top,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kTopProperty, top,);
  }

  get transform() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTransformProperty);
  }
  set transform(
    transform) {
    this.SetPropertyValueStringByKey(PropertyKey.kTransformProperty, transform,);
  }

  get transformOrigin() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTransformOriginProperty);
  }
  set transformOrigin(
    transform_origin,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kTransformOriginProperty, transform_origin,
    );
  }

  // get transition() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTransitionProperty);
  // }
  //
  // set transition(
  //   transition) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kTransitionProperty, transition,);
  // }
  //
  // get transition_delay() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTransitionDelayProperty);
  // }
  //
  // set transition_delay(
  //   transition_delay,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kTransitionDelayProperty, transition_delay,
  //   );
  // }
  //
  // get transition_duration() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTransitionDurationProperty);
  // }
  //
  // set transition_duration(
  //   transition_duration,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kTransitionDurationProperty, transition_duration,
  //   );
  // }
  //
  // get transition_property() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTransitionPropertyProperty);
  // }
  //
  // set transition_property(
  //   transition_property,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kTransitionPropertyProperty, transition_property,
  //   );
  // }
  //
  // get transition_timing_function() {
  //   return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kTransitionTimingFunctionProperty);
  // }
  //
  // set transition_timing_function(
  //   transition_timing_function,
  // ) {
  //   this.SetPropertyValueStringByKey(PropertyKey.kTransitionTimingFunctionProperty,
  //     transition_timing_function,);
  // }

  get verticalAlign() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kVerticalAlignProperty);
  }
  set verticalAlign(
    vertical_align,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kVerticalAlignProperty, vertical_align,
    );
  }

  get visibility() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kVisibilityProperty);
  }

  set visibility(
    visibility) {
    this.SetPropertyValueStringByKey(PropertyKey.kVisibilityProperty, visibility,);
  }

  get whiteSpace() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kWhiteSpaceProperty);
  }
  set whiteSpace(
    white_space) {
    this.SetPropertyValueStringByKey(PropertyKey.kWhiteSpaceProperty, white_space,
    );
  }

  get width() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kWidthProperty);
  }

  set width(width,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kWidthProperty, width,);
  }

// word-wrap is treated as an alias for overflow-wrap
//   https://www.w3.org/TR/css-text-3/#overflow-wrap
  get wordWrap() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kOverflowWrapProperty);
  }
  set wordWrap(
    word_wrap) {
    this.SetPropertyValueStringByKey(PropertyKey.kWordWrapProperty, word_wrap,);
  }

  get zIndex() {
    return this.GetDeclaredPropertyValueStringByKey(PropertyKey.kZIndexProperty);
  }
  set zIndex(z_index,
  ) {
    this.SetPropertyValueStringByKey(PropertyKey.kZIndexProperty, z_index,);
  }
}
