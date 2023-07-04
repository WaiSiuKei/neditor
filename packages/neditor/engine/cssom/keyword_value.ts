import { PropertyValue } from './property_value';
import type { PropertyValueVisitor } from './property_value_visitor';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import {
  kAbsoluteKeywordName, kAlternateKeywordName, kAlternateReverseKeywordName, kAutoKeywordName, kBackwardsKeywordName, kBaselineKeywordName, kBlockKeywordName, kBothKeywordName, kBottomKeywordName, kBreakWordKeywordName, kCenterKeywordName, kClipKeywordName, kCollapseKeywordName, kColumnKeywordName, kColumnReverseKeywordName, kContainKeywordName, kContentKeywordName, kCoverKeywordName, kCurrentColorKeywordName, kCursiveKeywordName, kEllipsisKeywordName, kEndKeywordName, kEquirectangularKeywordName, kFantasyKeywordName, kFixedKeywordName, kFlexEndKeywordName, kFlexKeywordName, kFlexStartKeywordName, kForwardsKeywordName, kHiddenKeywordName, kInfiniteKeywordName, kInheritKeywordName, kInitialKeywordName, kInlineBlockKeywordName, kInlineFlexKeywordName, kInlineKeywordName, kLeftKeywordName, kLineThroughKeywordName, kMiddleKeywordName, kMonoscopicKeywordName, kMonospaceKeywordName, kNoneKeywordName, kNoRepeatKeywordName, kNormalKeywordName, kNowrapKeywordName, kPreKeywordName, kPreLineKeywordName, kPreWrapKeywordName, kRelativeKeywordName, kRepeatKeywordName, kReverseKeywordName, kRightKeywordName, kRowKeywordName, kRowReverseKeywordName, kSansSerifKeywordName, kScrollKeywordName, kSerifKeywordName, kSolidKeywordName, kSpaceAroundKeywordName, kSpaceBetweenKeywordName, kStartKeywordName, kStaticKeywordName, kStereoscopicLeftRightKeywordName, kStereoscopicTopBottomKeywordName,
  kStretchKeywordName,
  kTopKeywordName,
  kUppercaseKeywordName,
  kVisibleKeywordName,
  kWrapKeywordName,
  kWrapReverseKeywordName
} from './keyword_names';
import { baseGetTypeId } from '../base/type_id';
import {camelCase} from 'lodash-es'
export enum Value {
  // "absolute" is a value of "position" property which indicates that values
  // of "top", "right", "bottom", and "left" properties specify offsets
  // with respect to the box's containing block.
  //   https://www.w3.org/TR/CSS21/visuren.html#choose-position
  kAbsolute,

  // "alternate" is a possible value of the "animation-direction" property.
  //   https://www.w3.org/TR/2013/WD-css3-animations-20130219/#animation-direction-property
  kAlternate,

  // "alternate-reverse" is a possible value of the "animation-direction"
  // property.
  //   https://www.w3.org/TR/2013/WD-css3-animations-20130219/#animation-direction-property
  kAlternateReverse,

  // "auto" is a value of "width" and "height" properties which indicates
  // that used value of these properties depends on the values of other
  // properties.
  //   https://www.w3.org/TR/CSS21/visudet.html#the-width-property
  //   https://www.w3.org/TR/CSS21/visudet.html#the-height-property
  // "auto" is a value of the "overflow" property whose behavior is dependent
  // on the user agent; it generally should provide a scrolling mechanism for
  // overflowing boxes.
  //   https://www.w3.org/TR/CSS21/visufx.html#overflow
  kAuto,

  // "backwards" is a value of "animation-fill-mode" property which causes the
  // animation results to fill in backwards around the animation's active
  // duration.
  //   https://www.w3.org/TR/css3-animations/#animation-fill-mode-property
  kBackwards,

  // "baseline" is a zero value of "vertical-align" property that indicates
  // that the content should be aligned at the baselines.
  //   https://www.w3.org/TR/CSS21/visudet.html#propdef-vertical-align
  // "baseline" is a value of "align-items" and "align-self" properties which
  // causes flex items to be aligned on the cross axis at the same baseline,
  // and at the cross axis start. In zero ordering and orientation, that
  // means those flex items are aligned with their baseline to baseline of
  // the item with the largest distance to it's top margin.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-items-baseline
  kBaseline,

  // "block" is a value of "display" property which causes an element
  // to generate a block box (block-level block container).
  //   https://www.w3.org/TR/CSS21/visuren.html#display-prop
  kBlock,

  // "both" is a value of "animation-fill-mode" property which causes the
  // animation results to fill in forwards and backwards around the
  // animation's active duration.
  //   https://www.w3.org/TR/css3-animations/#animation-fill-mode-property
  kBoth,

  // "bottom" is a value of "background-position" property that computes to
  // 100% for the vertical position if one or two values are given, otherwise
  // specifies the bottom edge as the origin for the next offset.
  //  https://www.w3.org/TR/css3-background/#the-background-position
  kBottom,

  // "break-word" is a value of "overflow-wrap" property which specifies to
  // the user agent that an unbreakable word may be broken at an arbitrary
  // point if there are no otherwise-acceptable break points in the line.
  //   https://www.w3.org/TR/css-text-3/#overflow-wrap-property
  kBreakWord,

  // "center" is a value of "text-align" property that indicates that the
  // content should be aligned horizontally centered.
  //   https://www.w3.org/TR/css-text-3/#text-align
  // "center" is a value of "align-content" property which causes flex lines
  // to be packed on the cross axis around the center of the flex container.
  // In zero ordering and orientation, that means all flex lines are
  // stacked in the vertical center of the flex container.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-content-center
  // "center" is a value of "align-items" and "align-self" properties which
  // causes flex items to be aligned with the center of the cross axis within
  // a flex line. In zero ordering and orientation, that means those flex
  // items are at the vertical center of their flex line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-items-center
  // "center" is a value of "justify-content" which positions flex items
  // after flexible lengths and auto margins have been resolved. It causes
  // flex items to be packed on the main axis toward the start of the flex
  // line. In zero ordering and orientation, that means all flex items are
  // packed on the horizontal center of their flex line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-justify-content-center
  kCenter,

  // "clip" is a value of "text-overflow" property which specifies clipping
  // content that overflows its block container element. Characters may be
  // only partially rendered.
  //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
  kClip,

  // "collapse" is a value of "visibility" property which causes a flex item
  // to become a collapsed flex item.
  // https://www.w3.org/TR/css-flexbox-1/#visibility-collapse
  // For other elements, "collapse" has the same meaning as "hidden".
  // https://www.w3.org/TR/CSS21/visufx.html#propdef-visibility
  kCollapse,

  // "column" is a value of "flex-direction" property, which specifies that
  // the main axis of the flex container has the same orientation as the
  // block axis of the current writing mode. For the zero writing mode,
  // that is top to bottom.
  //   https://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction
  kColumn,

  // "column-reverse" is a value of "flex-direction" property, which
  // specifies that the main axis of the flex container has the opposite
  // orientation as the block axis of the current writing mode. For the
  // zero writing mode, that is bottom to top.
  //   https://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction
  kColumnReverse,

  // "contain" is a value of "background-size" property which scales the
  // image to the largest size such that both its width and its height can
  // completely cover the background positioning area.
  //   https://www.w3.org/TR/css3-background/#the-background-size
  kContain,

  // "content" is a value of the "flex-basis" property which indicates an
  // automatic size based on the flex item's content.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-flex-basis-content
  kContent,

  // "cover" is a value of "background-size" property which scales the image
  // to the smallest size such that both its width and its height can fit
  // inside the background positioning area.
  //   https://www.w3.org/TR/css3-background/#the-background-size
  kCover,

  // "currentColor" is the initial value of "border-color" property.
  // CSS3 extends the color value to include the 'currentColor' keyword
  // to allow its use with all properties that accept a <color> value.
  //   https://www.w3.org/TR/css3-color/#currentcolor
  kCurrentColor,

  // "cursive" is a value of "font_family" property which indicates a generic
  // font family using a more informal script style.
  //   https://www.w3.org/TR/css3-fonts/#generic-font-families
  kCursive,

  // "ellipsis" is a value of "text-overflow" property which specifies
  // rendering an ellipsis to represent clipped inline content.
  //   https://www.w3.org/TR/css3-ui/#propdef-text-overflow
  kEllipsis,

  // "end" is a value of "text-align" property that indicates that content
  // is aligned at the end edge of the line box.
  //   https://www.w3.org/TR/css-text-3/#text-align
  kEnd,

  // "equirectangular" is a value of a parameter of the "map-to-mesh"
  // filter function which indicates that the built-in equirectangular mesh
  // should be used.
  kEquirectangular,

  // "fantasy" is a value of "font_family" property which indicates a generic
  // font family using decorative or expressive representations of characters.
  //   https://www.w3.org/TR/css3-fonts/#generic-font-families
  kFantasy,

  // "fixed" is a value of the "position" property which indicates that
  // the element is positioned and the element's containing block should be
  // set to the viewport.
  //   https://www.w3.org/TR/CSS21/visuren.html#choose-position
  kFixed,

  // "flex" is a value of "display" property which causes an element
  // to generate a block-level flex container.
  //   https://www.w3.org/TR/css-flexbox-1/#flex-containers
  kFlex,

  // "flex-end" is a value of "align-content" property which causes flex
  // lines to be packed on the cross axis toward the end of the flex
  // container. In zero ordering and orientation, that means all flex
  // lines are stacked at the bottom of the flex container.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-content-flex-end
  // "flex-end" is a value of "align-items" and "align-self" properties which
  // causes flex items to be aligned with the end of the cross axis within a
  // flex line. In zero ordering and orientation, that means those flex
  // items are at the bottom of their flex line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-items-flex-end
  // "flex-end" is a value of "justify-content" which positions flex items
  // after flexible lengths and auto margins have been resolved. It causes
  // flex items to be packed on the main axis toward the end of the flex
  // line. In zero ordering and orientation, that means all flex items are
  // packed on the right side of their flex line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-justify-content-flex-end
  kFlexEnd,

  // "flex-start" is a value of "align-content" property which causes flex
  // lines to be packed on the cross axis toward the start of the flex
  // container. In zero ordering and orientation, that means all flex
  // lines are stacked at the top of the flex container.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-content-flex-start
  // "flex-start" is a value of "align-items" and "align-self" properties
  // which causes flex items to be aligned with the start of the cross axis
  // within a flex line. In zero ordering and orientation, that means
  // those flex items are at the top of their flex line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-items-flex-start
  // "flex-start" is a value of "justify-content" which positions flex items
  // after flexible lengths and auto margins have been resolved. It causes
  // flex items to be packed on the main axis toward the start of the flex
  // line. In zero ordering and orientation, that means all flex items are
  // packed on the left side of their flex line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-justify-content-flex-start
  kFlexStart,

  // "forwards" is a value of "animation-fill-mode" property which causes the
  // animation results to fill in forwards around the animation's active
  // duration.
  //   https://www.w3.org/TR/css3-animations/#animation-fill-mode-property
  kForwards,

  // "hidden" is a value of "overflow" property which indicates that
  // the content is clipped.
  //   https://www.w3.org/TR/CSS21/visufx.html#overflow
  // "hidden" is a value of "visibility" property which indicates that
  // the generated box is invisible.
  //   https://www.w3.org/TR/CSS21/visufx.html#propdef-visibility
  kHidden,

  // "infinite" is a value of "animation-iteration-count" property which
  // causes the animation to loop forever.
  //   https://www.w3.org/TR/css3-animations/#animation-iteration-count-property
  kInfinite,

  // Applicable to any property, represents a cascaded value of "inherit",
  // which means that, for a given element, the property takes the same
  // specified value as the property for the element's parent.
  //   https://www.w3.org/TR/CSS21/cascade.html#value-def-inherit
  kInherit,

  // Applicable to any property, the "initial" keyword represents
  // the specified value that is designated as the property's initial value.
  //   https://www.w3.org/TR/css3-values/#common-keywords
  kInitial,

  // "inline" is a value of "display" property which causes an element
  // to generate one or more inline boxes.
  //   https://www.w3.org/TR/CSS21/visuren.html#display-prop
  kInline,

  // "inline-block" is a value of "display" property which causes an element
  // to generate an inline-level block container.
  //   https://www.w3.org/TR/CSS21/visuren.html#display-prop
  kInlineBlock,

  // "inline-flex" is a value of "display" property which causes an element
  // to generate an inline-level flex container.
  //   https://www.w3.org/TR/css-flexbox-1/#flex-containers
  kInlineFlex,

  // "left" is a value of "text-align" property that indicates that the
  // content should be aligned horizontally to the left.
  //   https://www.w3.org/TR/css-text-3/#text-align
  kLeft,

  // "line-through" is a value of "text-decoration-line" property that
  // indicates that the line of text has a line through the middle.
  kLineThrough,

  // "middle" is a value of "vertical-align" property that indicates that the
  // content should be aligned vertically centered.
  //   https://www.w3.org/TR/CSS21/visudet.html#propdef-vertical-align
  kMiddle,

  // "monoscopic" is a value of the "cobalt-mtm" property which indicates
  // that the mesh should only be rendered through one eye.
  kMonoscopic,

  // "monospace" is a value of "font_family" property which indicates a
  // generic
  // font family using glyphs with the same fixed width.
  //   https://www.w3.org/TR/css3-fonts/#generic-font-families
  kMonospace,

  // "none" is a value of "transform" property which means that HTML element
  // is rendered as is.
  //   https://www.w3.org/TR/css3-transforms/#transform-property
  kNone,

  // "no-repeat" is a value of "background-repeat" property which means that
  // image is not repeated in a specific direction.
  //   https://www.w3.org/TR/css3-background/#background-repeat
  kNoRepeat,

  // "normal" is a value of "line-height" property which tells user agents
  // to set the used value to a "reasonable" value based on the font
  // of the element.
  //   https://www.w3.org/TR/CSS21/visudet.html#line-height
  kNormal,

  // "nowrap" is a value of "white-space" property which tells user agents
  // that white space should be collapsed as for "normal" but line breaks
  // should be suppressed within text.
  //   https://www.w3.org/TR/css3-text/#white-space-property
  // "nowrap" is the initial value of "flex-wrap" property which indicates
  // that the flex container is single-line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-flex-wrap-wrap
  kNowrap,

  // "pre" is a value of "white-space" property which tells user agents that
  // white space inside the element should not be collapsed and lines should
  // only be broken at preserved newline characters.
  //   https://www.w3.org/TR/css3-text/#white-space-property
  kPre,

  // "pre-line" is a value of "white-space" property which tells user agents
  // that white space inside the element should be collapsed and lines should
  // be broken at preserved newline characters and as necessary to fill line
  // boxes, meaning that wrapping is allowed.
  //   https://www.w3.org/TR/css3-text/#white-space-property
  kPreLine,

  // "pre-wrap" is a value of "white-space" property which tells user agents
  // that white space inside the element should not be collapsed and lines
  // should be broken at preserved newline characters and as necessary to fill
  // line boxes, meaning that wrapping is allowed.
  //   https://www.w3.org/TR/css3-text/#white-space-property
  kPreWrap,

  // "relative" is a value of "position" property which indicates that values
  // of "top", "right", "bottom", and "left" properties specify offsets
  // with respect to the box's in-flow position.
  //   https://www.w3.org/TR/CSS21/visuren.html#choose-position
  kRelative,

  // "repeat" is a value of "background-repeat" property which means that
  // image is repeated in a specific direction.
  //   https://www.w3.org/TR/css3-background/#background-repeat
  kRepeat,

  // "reverse" is a possible value of the "animation-direction" property.
  //   https://www.w3.org/TR/2013/WD-css3-animations-20130219/#animation-direction-property
  kReverse,

  // "right" is a value of "text-align" property that indicates that the
  // content should be aligned horizontally to the right.
  //   https://www.w3.org/TR/css-text-3/#text-align
  kRight,

  // "row" is a value of "flex-direction" property, which specifies that the
  // main axis of the flex container has the same orientation as the inline
  // axis of the current writing mode. For the zero writing mode, that is
  // left to right.
  //   https://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction
  kRow,

  // "row-reverse" is a value of "flex-direction" property, which specifies
  // that the main axis of the flex container has the opposite orientation as
  // the inline axis of the current writing mode. For the zero writing
  // mode, that is right to left.
  //   https://www.w3.org/TR/css-flexbox-1/#propdef-flex-direction
  kRowReverse,

  // "sans-serif" is a value of "font_family" property which indicates a
  // generic font family using glyphs with low contrast and plain stroke
  // endings (without flaring, cross stroke or other ornamentation).
  //   https://www.w3.org/TR/css3-fonts/#generic-font-families
  kSansSerif,

  // "scroll" is a value of the "overflow" property which indicates that
  // content is clipped and a scrolling mechanism should be provided.
  //   https://www.w3.org/TR/CSS21/visufx.html#overflow
  kScroll,

  // "serif" is a value of "font_family" property which indicates a generic
  // font family representing the formal text style for script.
  //   https://www.w3.org/TR/css3-fonts/#generic-font-families
  kSerif,

  // "solid" is a value of "border-style" property which indicates a single
  // line segment.
  //   https://www.w3.org/TR/css3-background/#border-style
  kSolid,

  // "space-around" is a value of "align-content" property which causes flex
  // lines to be evenly distributed on the cross axis of the flex container,
  // with half-size spaces on either end.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-content-space-around
  // "space-around" is a value of "justify-content" which positions flex
  // items after flexible lengths and auto margins have been resolved. It
  // causes flex items to be evenly distributed over a flex line with
  // half-size spaces on either end.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-justify-content-space-around
  kSpaceAround,

  // "space-between" is a value of "align-content" property which causes flex
  // lines to be evenly distributed on the cross axis of the flex container,
  // with no space before the first or after the last line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-content-space-between
  // "space-between" is a value of "justify-content" which positions flex
  // items after flexible lengths and auto margins have been resolved. It
  // causes flex items to be evenly distributed over a flex line with no
  // space before the first or after the last flex item.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-justify-content-space-between
  kSpaceBetween,

  // "start" is a value of "text-align" property that indicates that content
  // is aligned at the start edge of the line box. This is the initial
  // value for "text-align"
  //   https://www.w3.org/TR/css-text-3/#text-align
  kStart,

  // "static" is a value of "position" property which indicates that a box
  // is laid out according to the normal flow.
  //   https://www.w3.org/TR/CSS21/visuren.html#choose-position
  kStatic,

  // "stereoscopic-left-right" is a value of the "cobalt-mtm" property which
  // indicates that the mesh should be rendered in two views
  // side-by-side.
  kStereoscopicLeftRight,

  // "stereoscopic-top-bottom" is a value of the "cobalt-mtm" property which
  // indicates that the mesh should be rendered in two views above and below.
  kStereoscopicTopBottom,

  // "stretch" is a value of "align-content" property which causes flex lines
  // to be stretched on the cross axis to fill the free space of the flex
  // container. In zero ordering and orientation, that means the flex
  // lines fill all available vertical space of the flex container.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-content-stretch
  // "stretch" is a value of "align-items" and "align-self" properties which
  // causes flex items with cross size "auto" and with cross axis margins
  // other than "auto" to be stretched over the cross axis within a flex
  // line. In zero ordering and orientation, that means those flex items
  // use all available vertical space of their flex line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-align-items-stretch
  // "stretch" not is a value of "justify-content". To cause flex items to
  // stretch on the main axis to fill the free space, the functionality of
  // the "flex-grow" property should be used instead.
  //   https://www.w3.org/TR/css-flexbox-1/#justify-content-property
  kStretch,

  // "top" is a value of "vertical-align" property that indicates that the
  // content should be aligned vertically at the top.
  //   https://www.w3.org/TR/CSS21/visudet.html#propdef-vertical-align
  kTop,

  // "uppercase" is a value of "text_transform" property that indicates that
  // all characters in each word of the element's text should be put in
  // uppercase.
  //   https://www.w3.org/TR/css3-text/#text-transform-property
  kUppercase,

  // "visible" is a value of "overflow" property which indicates that
  // the content is not clipped.
  //   https://www.w3.org/TR/CSS21/visufx.html#overflow
  // "visible" is a value of "visibility" property which indicates that
  // the generated box is visible.
  //   https://www.w3.org/TR/CSS21/visufx.html#propdef-visibility
  kVisible,

  // "wrap" is a value of "flex-wrap" property which indicates that the flex
  // container is multi-line.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-flex-wrap-wrap
  kWrap,

  // "wrap-reverse" is a value of "flex-wrap" property which indicates that
  // the flex container is multi-line, and that the cross-axis orientation is
  // reversed.
  //   https://www.w3.org/TR/css-flexbox-1/#valdef-flex-wrap-wrap-reverse
  kWrapReverse,

  kMaxKeywordValue = kWrapReverse,
}

let non_trivial_static_fields: NonTrivialStaticFields;

export class KeywordValue extends PropertyValue {
  GetTypeId(): number {
    return baseGetTypeId(KeywordValue);
  }
  // Since keyword values do not hold additional information and some of them
  // (namely "inherit" and "initial") are used extensively, for the sake of
  // saving memory an explicit instantiation of this class is disallowed.
  // Use factory methods below to obtain shared instances.
  static GetAbsolute() {
    return non_trivial_static_fields.absolute;
  }
  // static  GetAlternate(): KeywordValue
  // static  GetAlternateReverse(): KeywordValue
  static GetAuto() {
    return non_trivial_static_fields.auto;
  }
  // static  GetBackwards(): KeywordValue
  static GetBaseline() {
    return non_trivial_static_fields.baseline;
  }
  static GetBlock() {
    return non_trivial_static_fields.block;
  }
  // static  GetBoth();
  static GetBottom() {
    return non_trivial_static_fields.bottom;
  }
  static GetBreakWord() {
    return non_trivial_static_fields.breakWord;
  }
  static GetCenter() {
    return non_trivial_static_fields.center;
  }
  static GetClip() {
    return non_trivial_static_fields.clip;
  }
  // static  GetCollapse();
  // static  GetColumn();
  // static  GetColumnReverse();
  // static  GetContain();
  // static  GetContent();
  // static  GetCover();
  static GetCurrentColor() {
    return non_trivial_static_fields.currentColor;
  }
  // static  GetCursive();
  static GetEllipsis() {
    return non_trivial_static_fields.ellipsis;
  }
  static GetEnd() {
    return non_trivial_static_fields.end;
  }
  // static  GetEquirectangular();
  // static  GetFantasy();
  static GetFixed() {
    return non_trivial_static_fields.fixed;
  }
  static GetFlex() {
    return non_trivial_static_fields.flex;
  }
  // static  GetFlexEnd();
  static GetFlexStart() {
    return non_trivial_static_fields.flexStart;
  }
  // static  GetForwards();
  static GetHidden() {
    return non_trivial_static_fields.hidden;
  }
  // static  GetInfinite();
  static GetInherit() {
    return non_trivial_static_fields.inherit;
  }
  static GetInitial() {
    return non_trivial_static_fields.initial;
  }
  static GetInline() {
    return non_trivial_static_fields.inline;
  }
  static GetInlineBlock() {
    return non_trivial_static_fields.inlineBlock;
  }
  static GetInlineFlex() {
    return non_trivial_static_fields.inlineFlex;
  }
  static GetLeft() {
    return non_trivial_static_fields.left;
  }
  // static  GetLineThrough();
  static GetMiddle() {
    return non_trivial_static_fields.middle;
  }
  // static  GetMonoscopic();
  // static  GetMonospace();
  static GetNone() {
    return non_trivial_static_fields.none;
  }
  // static  GetNoRepeat();
  static GetNormal() {
    return non_trivial_static_fields.normal;
  }
  static GetNowrap() {
    return non_trivial_static_fields.nowrap;
  }
  static GetPre() {
    return non_trivial_static_fields.pre;
  }
  static GetPreLine() {
    return non_trivial_static_fields.preLine;
  }
  static GetPreWrap() {
    return non_trivial_static_fields.preWrap;
  }
  static GetRelative() {
    return non_trivial_static_fields.relative;
  }
  static GetRepeat() {
    return non_trivial_static_fields.repeat;
  }
  // static  GetReverse();
  static GetRight() {
    return non_trivial_static_fields.right;
  }
  static GetRow() {
    return non_trivial_static_fields.row;
  }
  // static  GetRowReverse();
  // static  GetSansSerif();
  static GetScroll() {
    return non_trivial_static_fields.scroll;
  }
  // static  GetSerif();
  static GetSolid() {
    return non_trivial_static_fields.solid;
  }
  // static  GetSpaceAround();
  // static  GetSpaceBetween();
  static GetStart() {
    return non_trivial_static_fields.start;
  }
  static GetStatic() {
    return non_trivial_static_fields.static;
  }
  // static  GetStereoscopicLeftRight();
  // static  GetStereoscopicTopBottom();
  static GetStretch(): KeywordValue {
    return non_trivial_static_fields.stretch;
  }
  static GetTop() {
    return non_trivial_static_fields.top;
  }
  static GetUppercase() {
    return non_trivial_static_fields.uppercase;
  }
  static GetVisible() {
    return non_trivial_static_fields.visible;
  }
  // static  GetWrap();
  // static  GetWrapReverse();

  static fromString(str: string): KeywordValue {
    const ret = Reflect.get(non_trivial_static_fields, camelCase(str));
    if (!ret) {
      NOTIMPLEMENTED();
      console.log('404', ret);
    }
    return ret;
  }

  constructor(value: Value) {
    super();
    this.value_ = value;
  }
  Accept(visitor: PropertyValueVisitor) {
    visitor.VisitKeyword(this);
  }

  value(): Value {
    return this.value_;
  }

  // static std::string GetName(Value value) {
  //   scoped_refptr<KeywordValue> keyword_value(new KeywordValue(value));
  //   return keyword_value->ToString();
  // }

  private value_: Value;

  ToString(): string {
    switch (this.value_) {
      case Value.kAbsolute:
        return kAbsoluteKeywordName;
      case Value.kAlternate:
        return kAlternateKeywordName;
      case Value.kAlternateReverse:
        return kAlternateReverseKeywordName;
      case Value.kAuto:
        return kAutoKeywordName;
      case Value.kBackwards:
        return kBackwardsKeywordName;
      case Value.kBaseline:
        return kBaselineKeywordName;
      case Value.kBlock:
        return kBlockKeywordName;
      case Value.kBoth:
        return kBothKeywordName;
      case Value.kBottom:
        return kBottomKeywordName;
      case Value.kBreakWord:
        return kBreakWordKeywordName;
      case Value.kCenter:
        return kCenterKeywordName;
      case Value.kClip:
        return kClipKeywordName;
      case Value.kCollapse:
        return kCollapseKeywordName;
      case Value.kColumn:
        return kColumnKeywordName;
      case Value.kColumnReverse:
        return kColumnReverseKeywordName;
      case Value.kContain:
        return kContainKeywordName;
      case Value.kContent:
        return kContentKeywordName;
      case Value.kCover:
        return kCoverKeywordName;
      case Value.kCurrentColor:
        return kCurrentColorKeywordName;
      case Value.kCursive:
        return kCursiveKeywordName;
      case Value.kEllipsis:
        return kEllipsisKeywordName;
      case Value.kEnd:
        return kEndKeywordName;
      case Value.kEquirectangular:
        return kEquirectangularKeywordName;
      case Value.kFantasy:
        return kFantasyKeywordName;
      case Value.kForwards:
        return kForwardsKeywordName;
      case Value.kFixed:
        return kFixedKeywordName;
      case Value.kFlex:
        return kFlexKeywordName;
      case Value.kFlexEnd:
        return kFlexEndKeywordName;
      case Value.kFlexStart:
        return kFlexStartKeywordName;
      case Value.kHidden:
        return kHiddenKeywordName;
      case Value.kInfinite:
        return kInfiniteKeywordName;
      case Value.kInherit:
        return kInheritKeywordName;
      case Value.kInitial:
        return kInitialKeywordName;
      case Value.kInline:
        return kInlineKeywordName;
      case Value.kInlineBlock:
        return kInlineBlockKeywordName;
      case Value.kInlineFlex:
        return kInlineFlexKeywordName;
      case Value.kLeft:
        return kLeftKeywordName;
      case Value.kLineThrough:
        return kLineThroughKeywordName;
      case Value.kMiddle:
        return kMiddleKeywordName;
      case Value.kMonospace:
        return kMonospaceKeywordName;
      case Value.kMonoscopic:
        return kMonoscopicKeywordName;
      case Value.kNone:
        return kNoneKeywordName;
      case Value.kNoRepeat:
        return kNoRepeatKeywordName;
      case Value.kNormal:
        return kNormalKeywordName;
      case Value.kNowrap:
        return kNowrapKeywordName;
      case Value.kPre:
        return kPreKeywordName;
      case Value.kPreLine:
        return kPreLineKeywordName;
      case Value.kPreWrap:
        return kPreWrapKeywordName;
      case Value.kRelative:
        return kRelativeKeywordName;
      case Value.kRepeat:
        return kRepeatKeywordName;
      case Value.kReverse:
        return kReverseKeywordName;
      case Value.kRight:
        return kRightKeywordName;
      case Value.kRow:
        return kRowKeywordName;
      case Value.kRowReverse:
        return kRowReverseKeywordName;
      case Value.kScroll:
        return kScrollKeywordName;
      case Value.kSansSerif:
        return kSansSerifKeywordName;
      case Value.kSerif:
        return kSerifKeywordName;
      case Value.kSolid:
        return kSolidKeywordName;
      case Value.kSpaceAround:
        return kSpaceAroundKeywordName;
      case Value.kSpaceBetween:
        return kSpaceBetweenKeywordName;
      case Value.kStart:
        return kStartKeywordName;
      case Value.kStatic:
        return kStaticKeywordName;
      case Value.kStereoscopicLeftRight:
        return kStereoscopicLeftRightKeywordName;
      case Value.kStereoscopicTopBottom:
        return kStereoscopicTopBottomKeywordName;
      case Value.kStretch:
        return kStretchKeywordName;
      case Value.kTop:
        return kTopKeywordName;
      case Value.kUppercase:
        return kUppercaseKeywordName;
      case Value.kVisible:
        return kVisibleKeywordName;
      case Value.kWrap:
        return kWrapKeywordName;
      case Value.kWrapReverse:
        return kWrapReverseKeywordName;
    }
    return '';
  }
  EQ(other: PropertyValue): boolean {
    if (!(other instanceof KeywordValue)) return false;
    return this.value_ === other.value_;
  }
}

class NonTrivialStaticFields {
  absolute: KeywordValue;
  alternate: KeywordValue;
  alternateReverse: KeywordValue;
  auto: KeywordValue;
  backwards: KeywordValue;
  baseline: KeywordValue;
  block: KeywordValue;
  both: KeywordValue;
  bottom: KeywordValue;
  breakWord: KeywordValue;
  center: KeywordValue;
  clip: KeywordValue;
  collapse: KeywordValue;
  column: KeywordValue;
  columnReverse: KeywordValue;
  contain: KeywordValue;
  content: KeywordValue;
  cover: KeywordValue;
  currentColor: KeywordValue;
  cursive: KeywordValue;
  ellipsis: KeywordValue;
  end: KeywordValue;
  equirectangular: KeywordValue;
  fantasy: KeywordValue;
  fixed: KeywordValue;
  flex: KeywordValue;
  flexEnd: KeywordValue;
  flexStart: KeywordValue;
  forwards: KeywordValue;
  hidden: KeywordValue;
  infinite: KeywordValue;
  inherit: KeywordValue;
  initial: KeywordValue;
  inlineBlock: KeywordValue;
  inlineFlex: KeywordValue;
  inline: KeywordValue;
  left: KeywordValue;
  lineThrough: KeywordValue;
  middle: KeywordValue;
  monoscopic: KeywordValue;
  monospace: KeywordValue;
  none: KeywordValue;
  noRepeat: KeywordValue;
  normal: KeywordValue;
  nowrap: KeywordValue;
  pre: KeywordValue;
  preLine: KeywordValue;
  preWrap: KeywordValue;
  relative: KeywordValue;
  repeat: KeywordValue;
  reverse: KeywordValue;
  right: KeywordValue;
  row: KeywordValue;
  rowReverse: KeywordValue;
  sansSerif: KeywordValue;
  scroll: KeywordValue;
  serif: KeywordValue;
  solid: KeywordValue;
  spaceAround: KeywordValue;
  spaceBetween: KeywordValue;
  start: KeywordValue;
  static: KeywordValue;
  stereoscopicLeftRight: KeywordValue;
  stereoscopicTopBottom: KeywordValue;
  stretch: KeywordValue;
  top: KeywordValue;
  uppercase: KeywordValue;
  visible: KeywordValue;
  wrap: KeywordValue;
  wrapReverse: KeywordValue;
  constructor() {
    this.absolute = new KeywordValue(Value.kAbsolute);
    this.alternate = new KeywordValue(Value.kAlternate);
    this.alternateReverse = new KeywordValue(Value.kAlternateReverse);
    this.auto = new KeywordValue(Value.kAuto);
    this.backwards = new KeywordValue(Value.kBackwards);
    this.baseline = new KeywordValue(Value.kBaseline);
    this.block = new KeywordValue(Value.kBlock);
    this.both = new KeywordValue(Value.kBoth);
    this.bottom = new KeywordValue(Value.kBottom);
    this.breakWord = new KeywordValue(Value.kBreakWord);
    this.center = new KeywordValue(Value.kCenter);
    this.clip = new KeywordValue(Value.kClip);
    this.collapse = new KeywordValue(Value.kCollapse);
    this.column = new KeywordValue(Value.kColumn);
    this.columnReverse = new KeywordValue(Value.kColumnReverse);
    this.contain = new KeywordValue(Value.kContain);
    this.content = new KeywordValue(Value.kContent);
    this.cover = new KeywordValue(Value.kCover);
    this.currentColor = new KeywordValue(Value.kCurrentColor);
    this.cursive = new KeywordValue(Value.kCursive);
    this.ellipsis = new KeywordValue(Value.kEllipsis);
    this.end = new KeywordValue(Value.kEnd);
    this.equirectangular = new KeywordValue(Value.kEquirectangular);
    this.fantasy = new KeywordValue(Value.kFantasy);
    this.fixed = new KeywordValue(Value.kFixed);
    this.flex = new KeywordValue(Value.kFlex);
    this.flexEnd = new KeywordValue(Value.kFlexEnd);
    this.flexStart = new KeywordValue(Value.kFlexStart);
    this.forwards = new KeywordValue(Value.kForwards);
    this.hidden = new KeywordValue(Value.kHidden);
    this.infinite = new KeywordValue(Value.kInfinite);
    this.inherit = new KeywordValue(Value.kInherit);
    this.initial = new KeywordValue(Value.kInitial);
    this.inlineBlock = new KeywordValue(Value.kInlineBlock);
    this.inlineFlex = new KeywordValue(Value.kInlineFlex);
    this.inline = new KeywordValue(Value.kInline);
    this.left = new KeywordValue(Value.kLeft);
    this.lineThrough = new KeywordValue(Value.kLineThrough);
    this.middle = new KeywordValue(Value.kMiddle);
    this.monoscopic = new KeywordValue(Value.kMonoscopic);
    this.monospace = new KeywordValue(Value.kMonospace);
    this.none = new KeywordValue(Value.kNone);
    this.noRepeat = new KeywordValue(Value.kNoRepeat);
    this.normal = new KeywordValue(Value.kNormal);
    this.nowrap = new KeywordValue(Value.kNowrap);
    this.pre = new KeywordValue(Value.kPre);
    this.preLine = new KeywordValue(Value.kPreLine);
    this.preWrap = new KeywordValue(Value.kPreWrap);
    this.relative = new KeywordValue(Value.kRelative);
    this.repeat = new KeywordValue(Value.kRepeat);
    this.reverse = new KeywordValue(Value.kReverse);
    this.right = new KeywordValue(Value.kRight);
    this.row = new KeywordValue(Value.kRow);
    this.rowReverse = new KeywordValue(Value.kRowReverse);
    this.sansSerif = new KeywordValue(Value.kSansSerif);
    this.scroll = new KeywordValue(Value.kScroll);
    this.serif = new KeywordValue(Value.kSerif);
    this.solid = new KeywordValue(Value.kSolid);
    this.spaceAround = new KeywordValue(Value.kSpaceAround);
    this.spaceBetween = new KeywordValue(Value.kSpaceBetween);
    this.start = new KeywordValue(Value.kStart);
    this.static = new KeywordValue(Value.kStatic);
    this.stereoscopicLeftRight = new KeywordValue(Value.kStereoscopicLeftRight);
    this.stereoscopicTopBottom = new KeywordValue(Value.kStereoscopicTopBottom);
    this.stretch = new KeywordValue(Value.kStretch);
    this.top = new KeywordValue(Value.kTop);
    this.uppercase = new KeywordValue(Value.kUppercase);
    this.visible = new KeywordValue(Value.kVisible);
    this.wrap = new KeywordValue(Value.kWrap);
    this.wrapReverse = new KeywordValue(Value.kWrapReverse);
  }
  // private auto_value_?: KeywordValue;
  // get auto_value(): KeywordValue {
  //   if (!this.auto_value_) this.auto_value_ = new KeywordValue(Value.kAuto);
  //   return this.auto_value_;
  // }
  // private stretch_value_?: KeywordValue;
  // get stretch_value(): KeywordValue {
  //   if (!this.stretch_value_) this.stretch_value_ = new KeywordValue(Value.kStretch);
  //   return this.stretch_value_;
  // }
  // private initial_value_?: KeywordValue;
  // get initial_value(): KeywordValue {
  //   if (!this.initial_value_) this.initial_value_ = new KeywordValue(Value.kInitial);
  //   return this.initial_value_;
  // }
  // private inline_value_?: KeywordValue;
  // get inline_value(): KeywordValue {
  //   if (!this.inline_value_) this.inline_value_ = new KeywordValue(Value.kInline);
  //   return this.inline_value_;
  // }
  // private block_value_?: KeywordValue;
  // get block_value() {
  //   if (!this.block_value_) this.block_value_ = new KeywordValue(Value.kBlock);
  //   return this.block_value_;
  // }
  // private static_value_?: KeywordValue;
  // get static_value() {
  //   if (!this.static_value_) this.static_value_ = new KeywordValue(Value.kStatic);
  //   return this.static_value_;
  // }
}

non_trivial_static_fields = new NonTrivialStaticFields();


