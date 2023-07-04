// The containing block in which the root element lives is a rectangle called
// the initial containing block. For continuous media, it has the dimensions
// of the viewport and is anchored at the canvas origin.
//   https://www.w3.org/TR/CSS2/visudet.html#containing-block-details

import { BlockLevelBlockContainerBox } from './block_formatting_block_container_box';
import type { ComputedStyleData } from '../cssom/computed_style_data';
import type { UsedStyleProvider } from './used_style';
import type { HTMLElement } from '../dom/html_element';
import type { Document } from '../dom/document';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import { MutableComputedStyleData } from '../cssom/computed_style_data';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { BaseDirection } from './base_direction';
import { KeywordValue } from '../cssom/keyword_value';
import { GetUsedColor } from './used_style';
import { PropertyListValue } from '../cssom/property_list_value';
import { DCHECK_GT } from '@neditor/core/base/check_op';

export interface InitialContainingBlockCreationResults {
  // Created initial containing block box results.
  box: BlockLevelBlockContainerBox;

  // The initial containing block may have its background style propagated into
  // it from the HTML or BODY element.  This value will point to which element
  // the value was propagated from, or it will be NULL if no style was
  // propagated.
  background_style_source: HTMLElement;
};

// This creates the initial containing block after adding background color
// and image to the initial style, when needed.
export function CreateInitialContainingBlock(
  default_initial_containing_block_style: ComputedStyleData,
  document: Document,
  used_style_provider: UsedStyleProvider,
  /*LayoutStatTracker* layout_stat_tracker*/): InitialContainingBlockCreationResults {
  TRACE_EVENT0('cobalt::layout', 'CreateInitialContainingBlock');

  let results: InitialContainingBlockCreationResults = Object.create(null);
  // results.background_style_source = NULL;

  let initial_containing_block_style = new MutableComputedStyleData();
  initial_containing_block_style.AssignFrom(default_initial_containing_block_style);

  // Propagate the computed background style of the <html> or <body> element
  // to the given style for the initial containing block.
  //   https://www.w3.org/TR/css3-background/#body-background
  if (!PropagateBackgroundStyleAndTestIfChanged(
    document.html()! as HTMLElement, initial_containing_block_style)) {
    if (PropagateBackgroundStyleAndTestIfChanged(
      document.body()!, initial_containing_block_style)) {
      results.background_style_source = document.body()!;
    }
  } else {
    results.background_style_source = document.html()! as HTMLElement;
  }

  let initial_style_state =
    new ComputedStyleDeclaration();
  initial_style_state.SetData(initial_containing_block_style);
//  initial_style_state.set_animations(new web_animations::AnimationSet());

  let base_direction = BaseDirection.kLeftToRightBaseDirection;
  let html = document.html();
  // if (html && html.GetUsedDirState() == dom::HTMLElement::kDirRightToLeft) {
  //   base_direction = kRightToLeftBaseDirection;
  // }

  results.box = new BlockLevelBlockContainerBox(
    initial_style_state,
    base_direction,
    used_style_provider,
    /*layout_stat_tracker*/)
  ;

  return results;
}

// Conditionally copies the background property. Returns true if anything is
// copied.
function PropagateBackgroundStyleAndTestIfChanged(
  element: HTMLElement,
  destination_style: MutableComputedStyleData): boolean {
  if (!element || !element.computed_style() ||
    element.computed_style()!.display == KeywordValue.GetNone()) {
    return false;
  }

  let computed_style =
    element.computed_style()!;

  let background_color_is_transparent =
    GetUsedColor(computed_style.background_color).a() == 0.0;

  let background_image_list = computed_style.background_image as PropertyListValue;
  DCHECK_GT(background_image_list.value().length, 0);

  let background_image_is_none =
    background_image_list.value().length == 1 &&
    background_image_list.value()[0] == KeywordValue.GetNone();

  if (!background_color_is_transparent || !background_image_is_none) {
    // The background color is copied if it is not transparent.
    if (!background_color_is_transparent) {
      destination_style.set_background_color(
        computed_style.background_color);
    }
    // The background image is copied if it is not 'None'.
    if (!background_image_is_none) {
      destination_style.set_background_image(
        computed_style.background_image);
    }
    return true;
  }
  return false;
}
