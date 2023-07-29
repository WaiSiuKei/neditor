import { BlockLevelBlockContainerBox } from './block_formatting_block_container_box';
import { ITextBoxRTreeItem, RTree, textBoxToRTreeItem } from './r_tree';
import { UsedStyleProvider } from './used_style';
import { Document } from '../dom/document';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import {
  kBenchmarkStatBoxGeneration,
  kBenchmarkStatRenderAndAnimate,
  kBenchmarkStatUpdateUsedSizes
} from './benchmark_stat_names';
import { LayoutUnit } from './layout_unit';
import { LayoutParams } from './box';
import { CreateInitialContainingBlock } from './initial_containing_block';
import { Paragraph, RefCountedParagraphCollection } from './paragraph';
import { BoxGenerator, Context } from './box_generator';
import { Node } from '../render_tree/node';
import { CompositionNode, CompositionNodeBuilder } from '../render_tree/composition_node';
import { Vector2dF } from '../math/vector2d_f';
import { BreakIterator, Locale } from '@neditor/icu';
import { ICopyableReference, IReference, MutableDisposable } from '../../base/common/lifecycle';
import { Optional } from '../../base/common/typescript';
import { TextBox } from './text_box';

export class ParagraphRefStore extends MutableDisposable<ICopyableReference<Paragraph>> {
}

export function UpdateComputedStylesAndLayoutBoxTree(
  locale: Locale,
  document: Document,
  dom_max_element_depth: number,
  used_style_provider: UsedStyleProvider,
  // LayoutStatTracker* layout_stat_tracker,
  textRTree: RTree<ITextBoxRTreeItem>,
  line_break_iterator: BreakIterator,
  character_break_iterator: BreakIterator,
  clear_window_with_background_color: boolean
): BlockLevelBlockContainerBox {

  TRACE_EVENT0('cobalt::layout', 'UpdateComputedStylesAndLayoutBoxTree()');

  // Update the computed style of all elements in the DOM, if necessary.
  document.UpdateComputedStyles();

  // base::StopWatch stop_watch_layout_box_tree(
  //   LayoutStatTracker::kStopWatchTypeLayoutBoxTree,
  //   base::StopWatch::kAutoStartOn, layout_stat_tracker);

  // Create initial containing block.
  let initial_containing_block_creation_results = CreateInitialContainingBlock(
    document.initial_computed_style_data()!, document,
    used_style_provider/*, layout_stat_tracker*/);
  let initial_containing_block: BlockLevelBlockContainerBox = initial_containing_block_creation_results.box;

  if (clear_window_with_background_color) {
    (initial_containing_block).set_blend_background_color(false);
  }

  // Associate the UI navigation root with the initial containing block.
//  if (document.window()) {
//    (*initial_containing_block)
//        .SetUiNavItem(document.window().GetUiNavRoot());
//  }

  // Generate boxes.
  const textBoxes = new Set<TextBox>();
  if (document.documentElement) {
    TRACE_EVENT0('cobalt::layout', kBenchmarkStatBoxGeneration);
    // base::StopWatch stop_watch_box_generation(
    //   LayoutStatTracker::kStopWatchTypeBoxGeneration,
    //   base::StopWatch::kAutoStartOn, layout_stat_tracker);

    // If the implicit root is a root for any observers, the initial containing
    // block should reference the corresponding IntersectionObserverRoots.
//    dom::HTMLElement* html_element =
//        document.document_element().AsHTMLElement();
//    BoxIntersectionObserverModule::IntersectionObserverRootVector roots =
//        html_element.GetLayoutIntersectionObserverRoots();
//    BoxIntersectionObserverModule::IntersectionObserverTargetVector targets =
//        html_element.GetLayoutIntersectionObserverTargets();
//    (*initial_containing_block)
//        .AddIntersectionObserverRootsAndTargets(std::move(roots),
//                                                 std::move(targets));
    const paragraphCollection = new RefCountedParagraphCollection();
    const paragraphRefStore = new ParagraphRefStore();
    let paragraphRef = paragraphCollection.acquire(
      Paragraph.ID.toString(),
      locale,
      initial_containing_block.base_direction(),
      [],
      line_break_iterator,
      character_break_iterator
    );
    paragraphRefStore.value = paragraphRef;

    let context = new Context(
      used_style_provider,
      // layout_stat_tracker,
      line_break_iterator,
      character_break_iterator,
      initial_containing_block_creation_results.background_style_source,
      dom_max_element_depth,
      paragraphCollection,
      textBoxes,
    );
    let root_box_generator = new BoxGenerator(
      initial_containing_block.css_computed_style_declaration(),
      //        (*initial_containing_block)
      //            ->css_computed_style_declaration()
      //            ->animations(),
      paragraphRefStore,
      1 /* dom_element_depth */,
      context
    );
    document.documentElement.Accept(root_box_generator);
    let root_boxes = root_box_generator.boxes();
    for (let box of root_boxes) {
      initial_containing_block.AddChild(box);
    }
    if (!paragraphRef.object.IsClosed()) paragraphRef.object.Close();
    paragraphRef.dispose();
    paragraphRefStore.dispose();
  }

  // Split bidi level runs.
  // The bidi levels were calculated for the paragraphs during box generation.
  // Now the text boxes are split between level runs, so that they will be
  // reversible during layout without requiring additional run-induced splits.
  {
    TRACE_EVENT0('cobalt::layout', 'SplitBidiLevelRuns');
    initial_containing_block.SplitBidiLevelRuns();
  }

  // Layout.
  {
    TRACE_EVENT0('cobalt::layout', kBenchmarkStatUpdateUsedSizes);
    // base::StopWatch stop_watch_update_used_sizes(
    // LayoutStatTracker::kStopWatchTypeUpdateUsedSizes,
    // base::StopWatch::kAutoStartOn, layout_stat_tracker);

    initial_containing_block.set_left(new LayoutUnit());
    initial_containing_block.set_top(new LayoutUnit());
    initial_containing_block.UpdateSize(new LayoutParams());
  }

  {
    textRTree.clear();
    for (let box of textBoxes) {
      let s: Optional<TextBox> = box;
      while (s) {
        const item = textBoxToRTreeItem(s);
        textRTree.insert(item);

        s = s.GetSplitSibling();
      }
    }
  }

//  std::stringstream ss;
//  (*initial_containing_block) . DumpWithIndent(&ss, 2);
//  std::cout << ss.str() << std::endl;
  // Update all UI navigation elements with the sizes and positions of their
  // corresponding layout boxes.
//  if (document.ui_nav_needs_layout()) {
//    TRACE_EVENT0("cobalt::layout", "UpdateUiNavigationItems");
//    document.set_ui_nav_needs_layout(false);
//
//    const auto& ui_nav_elements = document.ui_navigation_elements();
//    (*initial_containing_block).UpdateUiNavigationItem();
//    for (dom::HTMLElement* html_element : ui_nav_elements) {
//      LayoutBoxes* layout_boxes = base::polymorphic_downcast<LayoutBoxes*>(
//          html_element.layout_boxes());
//      if (layout_boxes) {
//        for (Box* box : layout_boxes.boxes()) {
//          box.UpdateUiNavigationItem();
//        }
//      }
//    }
//  }
  used_style_provider.CleanupAfterLayout();
  return initial_containing_block;
}

export function GenerateRenderTreeFromBoxTree(
  used_style_provider: UsedStyleProvider,
  // layout_stat_tracker:   LayoutStatTracker,
  initial_containing_block: BlockLevelBlockContainerBox): Node {
  TRACE_EVENT0('cobalt::layout', 'GenerateRenderTreeFromBoxTree()');
  let render_tree_root_builder = new CompositionNodeBuilder();
  {
    TRACE_EVENT0('cobalt::layout', kBenchmarkStatRenderAndAnimate);
    // base::StopWatch stop_watch_render_and_animate(
    // LayoutStatTracker::kStopWatchTypeRenderAndAnimate,
    // base::StopWatch::kAutoStartOn, layout_stat_tracker);

    initial_containing_block.RenderAndAnimate(render_tree_root_builder, new Vector2dF(0, 0), initial_containing_block);
  }

  // During computed style update and RenderAndAnimate, we get the actual images
  // that are linked to their URLs. Now go through them and update the playing
  // status for animated images.
  // used_style_provider.UpdateAnimatedImages();

  let static_root_node = new CompositionNode(render_tree_root_builder);

  // Make it easy to animate the entire tree by placing an AnimateNode at the
  // root to merge any sub-AnimateNodes.
  // let animate_node = new AnimateNode(static_root_node);

  return static_root_node;
}
