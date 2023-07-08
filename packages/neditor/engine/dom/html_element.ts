// The basic interface, from which all the HTML elements' interfaces inherit,
// and which must be used by elements that have no additional requirements.
//   https://www.w3.org/TR/html50/dom.html#htmlelement
import { Element } from './element';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { DeclaredStyleDeclaration } from '../cssom/declared_style_declaration';
import type { Document } from './document';
import { LayoutBoxes } from '../layout/layout_boxes';
import { Directionality } from './directionality';
import { ComputedStyleData, PropertySetMatcher } from '../cssom/computed_style_data';
import { DCHECK } from '@neditor/core/base/check';
import { KeywordValue } from '../cssom/keyword_value';
import { DeclaredStyleData } from '../cssom/declared_style_data';
import { ViewportSize } from '../cssom/viewport_size';
import { Optional } from '@neditor/core/base/common/typescript';
import type { HTMLBodyElement } from './html_body_element';
import { PromoteToCascadedStyle } from '../cssom/cascaded_style';
import { PromoteToComputedStyle } from '../cssom/computed_style';
import {
  GetPropertyImpactsBoxCrossReferences,
  GetPropertyImpactsBoxGeneration,
  GetPropertyImpactsBoxSizes,
  GetPropertyImpactsChildComputedStyle,
  GetPropertyInheritance,
  ImpactsBoxCrossReferences,
  ImpactsBoxGeneration,
  ImpactsBoxSizes,
  ImpactsChildComputedStyle,
  Inherited,
  PropertyKey
} from '../cssom/property_definitions';
import type { HTMLBRElement } from './html_br_element';
import type { HTMLImageElement } from './html_image_element';
import type { FreehandElement } from './custom/freehand_element';
import { getFunctionName, TRACE_EVENT1 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { ConstructionType, Node } from './node';
import { assertValue, isString } from '@neditor/core/base/common/type';

export enum AncestorsAreDisplayed {
  kAncestorsAreDisplayed,
  kAncestorsAreNotDisplayed,
}

// https://html.spec.whatwg.org/commit-snapshots/ebcac971c2add28a911283899da84ec509876c44/#the-dir-attribute
export enum DirState {
  kDirAuto,
  kDirLeftToRight,
  kDirRightToLeft,
  kDirNotDefined,
}

// The enum PseudoElementType is used to track the type of pseudo element
export enum PseudoElementType {
  kAfterPseudoElementType,
  kBeforePseudoElementType,
  kMaxPseudoElementType,
  kNotPseudoElementType = kMaxPseudoElementType,
  kMaxAnyElementType,
};

class NonTrivialStaticFields {
  constructor() {
    let computed_style_invalidation_properties: PropertyKey[] = [];
    let layout_box_invalidation_properties: PropertyKey[] = [];
    let size_invalidation_properties: PropertyKey[] = [];
    let cross_references_invalidation_properties: PropertyKey[] = [];

    for (let i = 0; i <= PropertyKey.kMaxLonghandPropertyKey; ++i) {
      let property_key = i;

      if (GetPropertyImpactsChildComputedStyle(property_key) ==
        ImpactsChildComputedStyle.kImpactsChildComputedStyleYes) {
        computed_style_invalidation_properties.push(property_key);
      }

      // TODO: Revisit inherited property handling. Currently, all boxes are
      // invalidated if an inherited property changes, but now that inherited
      // properties dynamically update, this is likely no longer necessary.
      if (GetPropertyInheritance(property_key) == Inherited.kInheritedYes ||
        GetPropertyImpactsBoxGeneration(property_key) ==
        ImpactsBoxGeneration.kImpactsBoxGenerationYes) {
        layout_box_invalidation_properties.push(property_key);
      } else {
        if (GetPropertyImpactsBoxSizes(property_key) ==
          ImpactsBoxSizes.kImpactsBoxSizesYes) {
          size_invalidation_properties.push(property_key);
        }
        if (GetPropertyImpactsBoxCrossReferences(property_key) ==
          ImpactsBoxCrossReferences.kImpactsBoxCrossReferencesYes) {
          cross_references_invalidation_properties.push(property_key);
        }
      }
    }

    this.computed_style_invalidation_property_checker = new PropertySetMatcher(computed_style_invalidation_properties);
    this.layout_box_invalidation_property_checker = new PropertySetMatcher(layout_box_invalidation_properties);
    this.size_invalidation_property_checker = new PropertySetMatcher(size_invalidation_properties);
    this.cross_references_invalidation_property_checker = new PropertySetMatcher(cross_references_invalidation_properties);
  }

  // cssom::CSSComputedStyleData::
  computed_style_invalidation_property_checker: PropertySetMatcher;
  // cssom::CSSComputedStyleData::PropertySetMatcher
  layout_box_invalidation_property_checker: PropertySetMatcher;
  // cssom::CSSComputedStyleData::PropertySetMatcher
  size_invalidation_property_checker: PropertySetMatcher;
  // cssom::CSSComputedStyleData::PropertySetMatcher
  cross_references_invalidation_property_checker: PropertySetMatcher;
};

const non_trivial_static_fields = new NonTrivialStaticFields();

export class HTMLElement extends Element {
  protected computed_style_declaration_: ComputedStyleDeclaration;
  protected style_: DeclaredStyleDeclaration;
  // This contains information about the boxes generated from the element.
  protected layout_boxes_: LayoutBoxes | null;
  computed_style_valid_: boolean = false;
  descendant_computed_styles_valid_: boolean = false;

  // This represents the computed directionality for this element.
  //   https://html.spec.whatwg.org/commit-snapshots/ebcac971c2add28a911283899da84ec509876c44/#the-directionality
  // NOTE: Cobalt does not support either the CSS 'direction' or 'unicode-bidi'
  // properties, and instead relies entirely upon the 'dir' attribute for
  // determining directionality. Inheritance of directionality occurs via the
  // base direction of the parent element's paragraph.
  directionality_: Directionality | null;
  // Indicates whether this node has an ancestor which has display set to none
  // or not. This value gets updated when computed style is updated.
  ancestors_are_displayed_: AncestorsAreDisplayed = AncestorsAreDisplayed.kAncestorsAreDisplayed;

  constructor(local_name: string)
  constructor(document: Document, local_name: string)
  constructor(a1: Document | string, local_name?: string) {
    if (isString(a1)) {
      super(ConstructionType.kCreateHTMLElement, a1);
    } else {
      super(ConstructionType.kCreateHTMLElement, a1, local_name!);
    }
    this.computed_style_declaration_ = new ComputedStyleDeclaration();
    this.style_ = new DeclaredStyleDeclaration();
    this.layout_boxes_ = null;
    this.directionality_ = null;
  }
  computed_style_declaration() {
    return this.computed_style_declaration_;
  }
  computed_style() {
    return this.computed_style_declaration_.data()!;
  }
  get style() {
    return this.style_;
  }
  OnSetAttribute(name: string,
                 value: string) {
    // Be sure to update HTMLElement::Duplicate() to copy over values as needed.
    // if (name == 'dir') {
    //   SetDir(value);
    // } else if (name == 'tabindex') {
    //   SetTabIndex(value);
    // }

    // Always clear the matching state when an attribute changes. Any attribute
    // changing can potentially impact the matching rules.
    //   ClearRuleMatchingState();
  }
  OnRemoveAttribute(name: string) {
    //   if (name == "dir") {
    //   SetDir("");
    // } else if (name == "tabindex") {
    //   SetTabIndex("");
    // } else if (name == kUiNavFocusDurationAttribute) {
    //   SetUiNavFocusDuration("");
    // }
    //
    // // Always clear the matching state when an attribute changes. Any attribute
    // // changing can potentially impact the matching rules.
    // ClearRuleMatchingState();
  }
  AsHTMLElement() {
    return this;
  }
  AsHTMLBodyElement(): HTMLBodyElement | null {
    return null;
  }
  AsHTMLBRElement(): HTMLBRElement | null {
    return null;
  }
  AsHTMLImageElement(): Optional<HTMLImageElement> {
    return undefined;
  }
  AsFreehandElement(): Optional<FreehandElement> {
    return undefined;
  }
  // This is similar to dir_state() except it will resolve kDirAuto to
  // kDirLeftToRight or kDirRightToLeft according to the spec:
  //   https://html.spec.whatwg.org/commit-snapshots/ebcac971c2add28a911283899da84ec509876c44/#the-directionality
  // If "dir" was not defined for this element, then this function will return
  // kDirNotDefined.
  GetUsedDirState() {
    return DirState.kDirLeftToRight;
  }
  Duplicate(): Node {
    let document = this.GetDocument();
    assertValue(document);
    let new_html_element = document.createElement(this.local_name_) as HTMLElement;
    new_html_element.copyAttributes(this);
    new_html_element.style_.AssignFrom(this.style_);

    return new_html_element;
  }

// Layout box related methods.
  //
  // The LayoutContainerBox gives the HTML Element an interface to the container
  // box that result from it. The BoxList is set when layout is performed for a
  // node.
  set_layout_boxes(layout_boxes: LayoutBoxes) {
    this.layout_boxes_ = layout_boxes;
  }

  layout_boxes() {
    return this.layout_boxes_;
  }

  InvalidateLayoutBoxesOfNodeAndAncestors() {
    this.InvalidateLayoutBoxes();
    this.InvalidateLayoutBoxesOfAncestors();
  }
  InvalidateLayoutBoxesOfNodeAndDescendants() {
    this.InvalidateLayoutBoxes();
    this.InvalidateLayoutBoxesOfDescendants();
  }
  private InvalidateLayoutBoxes() {
    this.layout_boxes_ = null;
    // for (auto& pseudo_element : pseudo_elements_) {
    //   if (pseudo_element) {
    //     pseudo_element.reset_layout_boxes();
    //   }
    // }
    this.directionality_ = null;
  }
  InvalidateComputedStylesOfNodeAndDescendants() {
    this.computed_style_valid_ = false;
    this.descendant_computed_styles_valid_ = false;
    this.InvalidateComputedStylesOfDescendants();
  }

  UpdateComputedStyle(
    parent_computed_style_declaration: ComputedStyleDeclaration,
    root_computed_style: ComputedStyleData,
    //    const base::TimeDelta& style_change_event_time,
    ancestors_are_displayed: AncestorsAreDisplayed) {
    TRACE_EVENT1('cobalt::layout', getFunctionName(HTMLElement, this.UpdateComputedStyle), 'tag', this.tagName);
    let document = this.GetDocument();
    DCHECK(document, 'Element should be attached to document in order to ', 'participate in layout.');

    // Verify that the matching rules for this element are valid. They should have
    // been updated prior to UpdateComputedStyle() being called.
    // DCHECK(matching_rules_valid_);
    // If there is no previous computed style, there should also be no layout
    // boxes.
    DCHECK(this.computed_style() || !this.layout_boxes());

    // dom_stat_tracker_.OnUpdateComputedStyle();

    // The computed style must be generated if either the computed style is
    // invalid or no computed style has been created yet.
    let generate_computed_style = !this.computed_style_valid_ || !this.computed_style();

    // If any declared properties inherited from the parent are no longer valid,
    // then a new computed style must be generated with the updated inherited
    // values.
    if (!generate_computed_style &&
      !this.computed_style()!.AreDeclaredPropertiesInheritedFromParentValid()) {
      generate_computed_style = true;
    }

    // It is possible for computed style to have been updated on this element even
    // if its ancestors were set to display: none.  If this has changed, we would
    // need to update our computed style again, even if nothing else has changed.
    if (!generate_computed_style &&
      this.ancestors_are_displayed_ == AncestorsAreDisplayed.kAncestorsAreNotDisplayed &&
      ancestors_are_displayed == AncestorsAreDisplayed.kAncestorsAreDisplayed) {
      generate_computed_style = true;
    }

    // TODO: It maybe helpful to generalize this mapping framework in the
    // future to allow more data and context about where a cssom::PropertyValue
    // came from.
    // cssom::GURLMap property_key_to_base_url_map;
//  property_key_to_base_url_map[cssom::kBackgroundImageProperty] = document.url_as_gurl();

    // Flags tracking which cached values must be invalidated.
    let invalidation_flags = new UpdateComputedStyleInvalidationFlags();

    // We record this now before we make changes to the computed style and use
    // it later for the pseudo element computed style updates.
    // let old_is_displayed = this.computed_style() && this.IsDisplayed();

    if (generate_computed_style) {
      // dom_stat_tracker_.OnGenerateHtmlElementComputedStyle();
      DoComputedStyleUpdate(
        // matching_rules(),
        // property_key_to_base_url_map,
        this.style_.data(),
        parent_computed_style_declaration,
        root_computed_style,
        document!.viewport_size(),
        this.computed_style()!,
        //        style_change_event_time,
        //        &css_transitions_,
        //        &css_animations_,
        //        document.keyframes_map(),
        this.ancestors_are_displayed_,
        ancestors_are_displayed,
        IsPseudoElement.kIsNotPseudoElement,
        invalidation_flags,
        this.computed_style_declaration_,
      );

      // Update cached background images after resolving the urls in
      // background_image CSS property of the computed style, so we have all the
      // information to get the cached background images.
      // this.UpdateCachedBackgroundImagesFromComputedStyle();
    } else {
      // Update the inherited data if a new style was not generated. The ancestor
      // data with inherited properties may have changed.
      this.computed_style_declaration_.UpdateInheritedData();
    }

    // Update the displayed status of our ancestors.
    this.ancestors_are_displayed_ = ancestors_are_displayed;

    // Process pseudo elements. They must have their computed style generated if
    // either their owning HTML element's style was just generated or their
    // computed style is invalid (this occurs when their matching rules change).
//     for (int type = 0; type < kMaxPseudoElementType; ++type) {
//       PseudoElement* type_pseudo_element =
//         pseudo_element(PseudoElementType(type));
//       if (type_pseudo_element) {
//         if (generate_computed_style ||
//           type_pseudo_element.computed_style_invalid()) {
//           dom_stat_tracker_.OnGeneratePseudoElementComputedStyle();
//           DoComputedStyleUpdate(
//             type_pseudo_element.matching_rules(),
//           &property_key_to_base_url_map,
//             nullptr,
//             css_computed_style_declaration(),
//             root_computed_style,
//             document.viewport_size(),
//             type_pseudo_element.computed_style(),
// //            style_change_event_time,
// //            type_pseudo_element.css_transitions(),
// //            type_pseudo_element.css_animations(),
// //            document.keyframes_map(),
//             old_is_displayed ? kAncestorsAreDisplayed
//               : kAncestorsAreNotDisplayed,
//             IsDisplayed() ? kAncestorsAreDisplayed : kAncestorsAreNotDisplayed,
//             kIsPseudoElement,
//         &invalidation_flags,
//             type_pseudo_element.css_computed_style_declaration(),
//             nullptr
//         );
//           type_pseudo_element.clear_computed_style_invalid();
//         } else {
//           // Update the inherited data if a new style was not generated. The
//           // ancestor data with inherited properties may have changed.
//           type_pseudo_element.css_computed_style_declaration()
//         .UpdateInheritedData();
//         }
//       }
//     }

    if (invalidation_flags.mark_descendants_as_display_none) {
      this.MarkNotDisplayedOnDescendants();
    }
    if (invalidation_flags.invalidate_computed_styles_of_descendants) {
      this.InvalidateComputedStylesOfDescendants();
    }

    if (invalidation_flags.invalidate_layout_boxes) {
      this.InvalidateLayoutBoxesOfNodeAndAncestors();
      this.InvalidateLayoutBoxesOfDescendants();
    } else {
      if (invalidation_flags.invalidate_sizes) {
        this.InvalidateLayoutBoxSizes();
      }
      if (invalidation_flags.invalidate_cross_references) {
        this.InvalidateLayoutBoxCrossReferences();
      }
      if (invalidation_flags.invalidate_render_tree_nodes) {
        this.InvalidateLayoutBoxRenderTreeNodes();
      }
    }

    this.computed_style_valid_ = true;
    // pseudo_elements_computed_styles_valid_ = true;
  }

  // Returns true if this node and all of its ancestors do NOT have display set
  // to 'none'.
  IsDisplayed(): boolean {
    return this.ancestors_are_displayed_ == AncestorsAreDisplayed.kAncestorsAreDisplayed &&
      this.computed_style()!.display != KeywordValue.GetNone();
  }

  // Updates the cached computed style of this element and its descendants.
  UpdateComputedStyleRecursively(
    parent_computed_style_declaration: ComputedStyleDeclaration,
    root_computed_style: ComputedStyleData,
    //      const base::TimeDelta& style_change_event_time,
    ancestors_were_valid: boolean,
    current_element_depth: number) {
    let max_depth = this.GetDocument()!.dom_max_element_depth();
    if (max_depth > 0 && current_element_depth >= max_depth) {
      return;
    }

    // Update computed styles for this element if any aren't valid.
    let is_valid = ancestors_were_valid && this.AreComputedStylesValid();
    if (!is_valid) {
      this.UpdateComputedStyle(parent_computed_style_declaration, root_computed_style,
        /*style_change_event_time, */AncestorsAreDisplayed.kAncestorsAreDisplayed);
//    UpdateUiNavigation();
//    node_document().set_ui_nav_needs_layout(true);
//  } else if (ui_nav_needs_update_) {
//    UpdateUiNavigation();
    }

    // Do not update computed style for descendants of "display: none" elements,
    // since they do not participate in layout. Note the "display: none" elements
    // themselves still need to have their computed style updated, in case the
    // value of display is changed.
    if (this.computed_style()!.display == KeywordValue.GetNone()) {
      return;
    }

    // Update computed style for this element's descendants. Note that if
    // descendant_computed_styles_valid_ flag is not set, the ancestors should
    // still be considered invalid, which forces the computes styles to be updated
    // on all children.
    for (let element = this.first_element_child(); element;
         element = element.nextElementSibling) {
      let html_element = element.AsHTMLElement();
      if (html_element) {
        html_element.UpdateComputedStyleRecursively(
          this.computed_style_declaration(),
          root_computed_style,
//          style_change_event_time,
          is_valid && this.descendant_computed_styles_valid_,
          current_element_depth + 1);
      }
    }

    this.descendant_computed_styles_valid_ = true;
  }

  MarkNotDisplayedOnNodeAndDescendants() {
    // While we do want to clear the animations immediately, we also want to
    // ensure that they are also reset starting with the next computed style
    // update.  This ensures that for example a transition will not be triggered
    // on the next computed style update.
    this.ancestors_are_displayed_ = AncestorsAreDisplayed.kAncestorsAreNotDisplayed;

    // PurgeCachedBackgroundImages();
    //
    // if (!css_animations_.empty() || !css_transitions_.empty()) {
    //   css_transitions_.Clear();
    //   css_animations_.Clear();
    //   computed_style_valid_ = false;
    //   descendant_computed_styles_valid_ = false;
    // }

    // Also clear out all animations/transitions on pseudo elements.
    // for (auto& pseudo_element : pseudo_elements_) {
    //   if (pseudo_element) {
    //     pseudo_element.css_transitions().Clear();
    //     pseudo_element.css_animations().Clear();
    //   }
    // }

    this.MarkNotDisplayedOnDescendants();
  }

  InvalidateLayoutBoxSizes() {
    if (this.layout_boxes_) {
      this.layout_boxes_.InvalidateSizes();

      // for (auto& pseudo_element : pseudo_elements_) {
      //   if (pseudo_element && pseudo_element.layout_boxes()) {
      //     pseudo_element.layout_boxes().InvalidateSizes();
      //   }
      // }
    }
  }

  InvalidateLayoutBoxCrossReferences() {
    if (this.layout_boxes_) {
      this.layout_boxes_.InvalidateCrossReferences();

      // for (auto& pseudo_element : pseudo_elements_) {
      //   if (pseudo_element && pseudo_element.layout_boxes()) {
      //     pseudo_element.layout_boxes().InvalidateCrossReferences();
      //   }
      // }
    }
  }

  InvalidateLayoutBoxRenderTreeNodes() {
    if (this.layout_boxes_) {
      this.layout_boxes_.InvalidateRenderTreeNodes();

      // for (auto& pseudo_element : pseudo_elements_) {
      //   if (pseudo_element && pseudo_element.layout_boxes()) {
      //     pseudo_element.layout_boxes().InvalidateRenderTreeNodes();
      //   }
      // }
    }
  }

  AreComputedStylesValid() {
    return this.computed_style_valid_; /*&& pseudo_elements_computed_styles_valid_;*/
  }
}

class UpdateComputedStyleInvalidationFlags {
  mark_descendants_as_display_none = false;
  invalidate_computed_styles_of_descendants = false;
  invalidate_layout_boxes = false;
  invalidate_sizes = false;
  invalidate_cross_references = false;
  invalidate_render_tree_nodes = false;
};

enum IsPseudoElement {
  kIsNotPseudoElement,
  kIsPseudoElement,
};

function DoComputedStyleUpdate(
  // cssom::RulesWithCascadePrecedence* matching_rules,
  // cssom::GURLMap* property_key_to_base_url_map,
  inline_style: DeclaredStyleData,
  parent_computed_style_declaration: ComputedStyleDeclaration,
  root_computed_style: ComputedStyleData,
  viewport_size: ViewportSize,
  previous_computed_style: ComputedStyleData,
  //    const base::TimeDelta& style_change_event_time,
  //    cssom::TransitionSet* css_transitions,
  //    cssom::AnimationSet* css_animations,
  //    const cssom::CSSKeyframesRule::NameMap& keyframes_map,
  old_ancestors_are_displayed: AncestorsAreDisplayed,
  new_ancestors_are_displayed: AncestorsAreDisplayed,
  is_pseudo_element: IsPseudoElement,
  invalidation_flags: UpdateComputedStyleInvalidationFlags,
  css_computed_style_declaration: ComputedStyleDeclaration,
  computed_style_override: Optional<ComputedStyleData> = undefined,
) {
  let animations_modified = false;

  let new_computed_style = PromoteMatchingRulesToComputedStyle(
    // matching_rules,
    // property_key_to_base_url_map,
    inline_style,
    parent_computed_style_declaration,
    root_computed_style,
    viewport_size);

//  PossiblyActivateAnimations(previous_computed_style, new_computed_style,
//                             style_change_event_time, css_transitions,
//                             css_animations, keyframes_map,
//                             old_ancestors_are_displayed,
//                             new_ancestors_are_displayed, &animations_modified);

  UpdateInvalidationFlagsFromNewComputedStyle(
    previous_computed_style,
    computed_style_override ? computed_style_override : new_computed_style,
    animations_modified,
    is_pseudo_element,
    invalidation_flags);

  css_computed_style_declaration.SetData(computed_style_override ? computed_style_override : new_computed_style);
}

function PromoteMatchingRulesToComputedStyle(
  // cssom::RulesWithCascadePrecedence* matching_rules,
  // cssom::GURLMap* property_key_to_base_url_map,
  inline_style: DeclaredStyleData,
  parent_computed_style_declaration: ComputedStyleDeclaration,
  root_computed_style: ComputedStyleData,
  viewport_size: ViewportSize): ComputedStyleData {
  // Select the winning value for each property by performing the cascade,
  // that is, apply values from matching rules on top of inline style, taking
  // into account rule specificity and location in the source file, as well as
  // property declaration importance.
  let computed_style = PromoteToCascadedStyle(
      inline_style,
      // matching_rules,
      // property_key_to_base_url_map
    );

  // Lastly, absolutize the values, if possible. Start by resolving "initial"
  // and "inherit" keywords (which gives us what the specification refers to
  // as "specified style").  Then, convert length units and percentages into
  // pixels, convert color keywords into RGB triplets, and so on.  For certain
  // properties, like "font-family", computed value is the same as specified
  // value. Declarations that cannot be absolutized easily, like "width: auto;",
  // will be resolved during layout.
  PromoteToComputedStyle(
    computed_style,
    parent_computed_style_declaration,
    root_computed_style,
    viewport_size.width_height(),
    // property_key_to_base_url_map
  );

  return computed_style;
}

function UpdateInvalidationFlagsFromNewComputedStyle(
  old_computed_style: ComputedStyleData,
  new_computed_style: ComputedStyleData,
  animations_modified: boolean,
  is_pseudo_element: IsPseudoElement,
  flags: UpdateComputedStyleInvalidationFlags) {
  if (old_computed_style) {
    if (!flags.mark_descendants_as_display_none &&
      is_pseudo_element == IsPseudoElement.kIsNotPseudoElement &&
      NewComputedStyleMarksDescendantsAsDisplayNone(old_computed_style,
        new_computed_style)) {
      flags.mark_descendants_as_display_none = true;
    }
    if (!flags.invalidate_computed_styles_of_descendants &&
      NewComputedStyleInvalidatesComputedStylesOfDescendants(
        old_computed_style, new_computed_style)) {
      flags.invalidate_computed_styles_of_descendants = true;
      flags.invalidate_layout_boxes = true;
    } else if (!flags.invalidate_layout_boxes) {
      if (NewComputedStyleInvalidatesLayoutBoxes(old_computed_style,
        new_computed_style)) {
        flags.invalidate_layout_boxes = true;
      } else {
        if (!flags.invalidate_sizes &&
          NewComputedStyleInvalidatesSizes(old_computed_style,
            new_computed_style)) {
          flags.invalidate_sizes = true;
          flags.invalidate_render_tree_nodes = true;
        }
        if (!flags.invalidate_cross_references &&
          NewComputedStyleInvalidatesCrossReferences(old_computed_style,
            new_computed_style)) {
          flags.invalidate_cross_references = true;
          flags.invalidate_render_tree_nodes = true;
        }

        flags.invalidate_render_tree_nodes =
          flags.invalidate_render_tree_nodes || animations_modified ||
          !new_computed_style.DoDeclaredPropertiesMatch(old_computed_style);
      }
    }
  }
}

function NewComputedStyleMarksDescendantsAsDisplayNone(
  old_computed_style: ComputedStyleData,
  new_computed_style: ComputedStyleData): boolean {
  return old_computed_style.display != KeywordValue.GetNone() &&
    new_computed_style.display == KeywordValue.GetNone();
}

function NewComputedStyleInvalidatesComputedStylesOfDescendants(
  old_computed_style: ComputedStyleData,
  new_computed_style: ComputedStyleData): boolean {
  return !non_trivial_static_fields
    .computed_style_invalidation_property_checker
    .DoDeclaredPropertiesMatch(old_computed_style,
      new_computed_style);
}

function NewComputedStyleInvalidatesLayoutBoxes(
  old_computed_style: ComputedStyleData,
  new_computed_style: ComputedStyleData) {
  return !non_trivial_static_fields
    .layout_box_invalidation_property_checker
    .DoDeclaredPropertiesMatch(old_computed_style,
      new_computed_style);
}

function NewComputedStyleInvalidatesSizes(
  old_computed_style: ComputedStyleData,
  new_computed_style: ComputedStyleData) {
  return !non_trivial_static_fields
    .size_invalidation_property_checker.DoDeclaredPropertiesMatch(
      old_computed_style, new_computed_style);
}

function NewComputedStyleInvalidatesCrossReferences(
  old_computed_style: ComputedStyleData,
  new_computed_style: ComputedStyleData) {
  return !non_trivial_static_fields
    .cross_references_invalidation_property_checker
    .DoDeclaredPropertiesMatch(old_computed_style,
      new_computed_style);
}
