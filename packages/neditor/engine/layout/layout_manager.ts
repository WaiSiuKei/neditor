import { runWhenIdle } from '../../base/common/async';
import { Emitter } from '../../base/common/event';
import { Optional } from '../../base/common/typescript';
import type { OnRenderTreeProducedCallback } from '../browser/web_module';
import type { Window } from '../dom/window';
import type { Node as DOMNode } from '../dom/node';
import type { Node } from '../render_tree/node';
import { Time, TimeDelta } from '@neditor/core/base/time/time';
import { Paragraph } from './paragraph';
import { ITextBoxRTreeItem, RTree } from './r_tree';
import { UsedStyleProvider } from './used_style';
import { DocumentObserver } from '../dom/document';
import { castInt } from '@neditor/core/base/common/number';
import { DLOG, WARNING } from '@neditor/core/base/logging';
import {
  TRACE_EVENT0,
  TRACE_EVENT_BEGIN0,
  TRACE_EVENT_END0
} from '@neditor/core/base/trace_event/common/trace_event_common';
import { BlockLevelBlockContainerBox } from './block_formatting_block_container_box';
import { GenerateRenderTreeFromBoxTree, UpdateComputedStylesAndLayoutBoxTree } from './layout';
import { DCHECK } from '@neditor/core/base/check';
import { RepeatingTimer } from '@neditor/core/base/timer/timer';
import { kBenchmarkStatLayout } from './benchmark_stat_names';
import { noop } from '@neditor/core/base/common/functional';
import { allocStr, BreakIterator, Locale, } from '@neditor/icu';
import { Box } from './box';
import { assertIsDefined } from '@neditor/core/base/common/type';
import { LayoutUnit } from './layout_unit';
import { RectLayoutUnit } from './rect_layout_unit';
import { HitTestLevel } from '../../platform/input/common/input';
import RBush from 'rbush';

export type OnLayoutCallback = Function

export class LayoutResults {
  constructor(
    // The render tree produced by a layout.
    public render_tree: Node,
    // The time that the render tree was created, which will be used as a
    // reference point for updating the animations in the above render tree.
    public layout_time: TimeDelta,
    // Callback to run whenever the render tree is rasterized.
    public on_rasterized_callback: Function,
  ) {
  }
}

export class DOMHitTestResult {
  static forElement(node: DOMNode, box: Box): DOMHitTestResult {
    return new DOMHitTestResult(node, box);
  }
  protected constructor(
    public node: DOMNode,
    public box: Box,
  ) {
  }
}

export class LayoutManager implements DocumentObserver {
  window_: Window;
  locale_!: Locale;
  used_style_provider_: UsedStyleProvider;
  on_render_tree_produced_callback_: OnRenderTreeProducedCallback;
  on_layout_callback_: OnLayoutCallback;
  produced_render_tree_: boolean;
  are_computed_styles_and_box_tree_dirty_: boolean;
  is_render_tree_pending_: boolean;
  dom_max_element_depth_: number;
  layout_refresh_rate_: number;
  suspended_: boolean;
  clear_window_with_background_color_: boolean;
  layout_timer_: RepeatingTimer;
  line_break_iterator_: BreakIterator;
  character_break_iterator_: BreakIterator;
  // The initial containing block is kept until the next layout, so that
  // the box tree remains valid.
  initial_containing_block_?: BlockLevelBlockContainerBox;
  private _onDidLayout = new Emitter<void>();
  public onDidLayout = this._onDidLayout.event;

  textRTree: RTree<ITextBoxRTreeItem>;
  constructor(
    suspended: boolean,
    name: string,
    window: Window,
    on_render_tree_produced: OnRenderTreeProducedCallback,
    on_layout: Function,
    // layout_trigger,
    dom_max_element_depth: number,
    layout_refresh_rate: number,
    language: string,
    clear_window_with_background_color: boolean
  ) {
    this.window_ = window;
    const { object: { ptr: localePtr }, dispose } = allocStr(language);
    this.locale_ = Locale.createCanonical(localePtr);
    dispose();
    this.used_style_provider_ = new UsedStyleProvider(window.html_element_context(), window.document().font_cache());
    this.on_render_tree_produced_callback_ = on_render_tree_produced;
    this.on_layout_callback_ = on_layout;
    // this.layout_trigger_(layout_trigger),
    this.produced_render_tree_ = false;
    this.are_computed_styles_and_box_tree_dirty_ = true;
    this.is_render_tree_pending_ = true;
    this.dom_max_element_depth_ = dom_max_element_depth;
    this.layout_refresh_rate_ = layout_refresh_rate;
    // layout_stat_tracker_(layout_stat_tracker),
    this.suspended_ = suspended;
    this.clear_window_with_background_color_ = clear_window_with_background_color;
    this.layout_timer_ = new RepeatingTimer();
    this.window_.document().AddObserver(this);
    this.window_.document().SetSynchronousLayoutCallback(this.DoSynchronousLayout.bind(this));
    this.window_.document().SetSynchronousLayoutAndProduceRenderTreeCallback(this.DoSynchronousLayoutAndGetRenderTree.bind(this));
    this.line_break_iterator_ = BreakIterator.createLineInstance(this.locale_);
    this.character_break_iterator_ = BreakIterator.createCharacterInstance(this.locale_);

    this.textRTree = new RBush<ITextBoxRTreeItem>();
  }

  // From dom::DocumentObserver.
  OnLoad() {
    // Start the layout timer.  If the TestRunner is active, then we do not
    // start a timer as the TestRunner will drive the triggering of layouts.
    this.StartLayoutTimer();
  }

  OnMutation() {
    // if (this.layout_trigger_ == kOnDocumentMutation) {
    this.DirtyLayout();
    // }
  }

  StartLayoutTimer() {
    // TODO: Eventually we would like to instead base our layouts off of a
    //       "refresh" signal generated by the rasterizer, instead of trying to
    //       match timers to the graphics' refresh rate, which is error prone.
    let timer_interval_in_microseconds =
      castInt(Time.kMicrosecondsPerSecond / (this.layout_refresh_rate_ + 1.0));

    this.layout_timer_.Start(TimeDelta.FromMicroseconds(timer_interval_in_microseconds), this.DoLayoutAndProduceRenderTree.bind(this));
  }

  DoSynchronousLayout() {
    TRACE_EVENT0('cobalt::layout', 'LayoutManager::Impl::DoSynchronousLayout()');
    if (this.suspended_) {
      DLOG(WARNING, 'Skipping layout since Cobalt is in a suspended state.');
      return;
    }

    if (this.are_computed_styles_and_box_tree_dirty_) {
      if (this.initial_containing_block_) {
        this.initial_containing_block_.dispose();
      }
      this.initial_containing_block_ = UpdateComputedStylesAndLayoutBoxTree(
        this.locale_,
        this.window_.document(),
        this.dom_max_element_depth_,
        this.used_style_provider_,
        // layout_stat_tracker_,
        this.textRTree,
        this.line_break_iterator_,
        this.character_break_iterator_,
        this.clear_window_with_background_color_);
      this.are_computed_styles_and_box_tree_dirty_ = false;
      this._onDidLayout.fire();
    }
  }

  DoSynchronousLayoutAndGetRenderTree(): Node {
    TRACE_EVENT0('cobalt::layout',
      'LayoutManager::Impl::DoSynchronousLayoutAndGetRenderTree()');
    this.DoSynchronousLayout();

    let render_tree_root =
      GenerateRenderTreeFromBoxTree(
        this.used_style_provider_,
        // layout_stat_tracker_,
        this.initial_containing_block_!);

    // let current_time_milliseconds = this.window_.document().timeline().current_time();
    // DCHECK(current_time_milliseconds);
    // let current_time = TimeDelta.FromMilliseconds(current_time_milliseconds);

    // let animate_node = render_tree_root;
    // let results: AnimateResults = animate_node.Apply(current_time);

    // return results.animated.source();
    return render_tree_root;
  }

  DirtyLayout() {
    this.are_computed_styles_and_box_tree_dirty_ = true;
    this.is_render_tree_pending_ = true;
  }

  DoLayoutAndProduceRenderTree() {
    TRACE_EVENT0('cobalt::layout',
      'LayoutManager::Impl::DoLayoutAndProduceRenderTree()');

    if (this.suspended_) return;

    let document = this.window_.document();

    if (!document.html()) {
      return;
    }

    // Update the document's sample time, used for updating animations.
    document.SampleTimelineTime();

    let has_layout_processing_started = false;
    // if (this.window_.HasPendingAnimationFrameCallbacks()) {
    //   if (this.are_computed_styles_and_box_tree_dirty_) {
    //     has_layout_processing_started = true;
    //     TRACE_EVENT_BEGIN0("cobalt::layout", kBenchmarkStatLayout);
    //     // Update our computed style before running animation callbacks, so that
    //     // any transitioning elements adjusted during the animation callback will
    //     // transition from their previously set value.
    //     document.UpdateComputedStyles();
    //   }
    //
    //   // Note that according to:
    //   //     https://www.w3.org/TR/2015/WD-web-animations-1-20150707/#model-liveness,
    //   // "The time passed to a requestAnimationFrame callback will be equal to
    //   // document.timeline.currentTime".  In our case,
    //   // document.timeline.currentTime is derived from the latest sample time.
    //   this.window_.RunAnimationFrameCallbacks();
    // }

    // It should never be possible for for the computed styles and box tree to
    // be dirty when a render tree is not pending.
    DCHECK(this.is_render_tree_pending_ || !this.are_computed_styles_and_box_tree_dirty_);
    if (this.is_render_tree_pending_) {
      if (!has_layout_processing_started) {
        // We want to catch the beginning of all layout processing.  If it didn't
        // begin before the call to RunAnimationFrameCallbacks(), then the flow
        // starts here instead.
        TRACE_EVENT_BEGIN0('cobalt::layout', kBenchmarkStatLayout);
      }

      this.DoSynchronousLayout();

      // If no render tree has been produced yet, check if html display
      // should prevent the first render tree.
      let display_none_prevents_render = !this.produced_render_tree_ && !document.html()!.IsDisplayed();
      Reflect.set(window, 'dump', () => {
        console.log(this.initial_containing_block_?.DumpWithIndent());
      })
      if (!display_none_prevents_render) {
        let render_tree_root = GenerateRenderTreeFromBoxTree(this.used_style_provider_,
          // layout_stat_tracker_,
          this.initial_containing_block_!);
        let run_on_render_tree_produced_callback = true;
        this.produced_render_tree_ = true;

        let current_time = document.timeline().current_time()!;
        DCHECK(current_time);
        this.on_render_tree_produced_callback_(new LayoutResults(render_tree_root, TimeDelta.FromMilliseconds(current_time), noop));

        this.is_render_tree_pending_ = false;
        // runWhenIdle(() => {
        //   console.log(DumpRenderTreeToString(render_tree_root));
        // });
      }

      TRACE_EVENT_END0('cobalt::layout', kBenchmarkStatLayout);
    }

    this.on_layout_callback_();
  }

  hitTestDOM(posx: number, posy: number, opt: HitTestOptions): DOMHitTestResult[] {
    let x = new LayoutUnit(posx);
    let y = new LayoutUnit(posy);
    let hit: DOMHitTestResult[] = [];
    const toVisit: Box[] = [assertIsDefined(this.initial_containing_block_)];
    while (toVisit.length) {
      const layoutBox = toVisit.pop()!;
      let hitted = false;
      let domNode = layoutBox.node;
      if (layoutBox === this.initial_containing_block_) {
        hitted = true;
      } else if (domNode) {
        let el = domNode.AsElement();
        if (el && (el.tagName === 'html' || el.tagName === 'body')) {
          hitted = true;
        }
      }
      if (layoutBox.AsAnonymousBlockBox()) {
        hitted = true;
      }

      let rect: RectLayoutUnit | undefined;
      if (!hitted) {
        rect = layoutBox.GetClientRect();
        hitted = rect.top().LE(y) && rect.bottom().GE(y) && rect.left().LE(x) && rect.right().GE(x);
      }

      if (hitted) {
        let textBox = layoutBox.AsTextBox();
        if (textBox) {
          if (opt.hitTestLevel >= HitTestLevel.InlineBox) {
            const textNode = assertIsDefined(textBox.node);
            hit.push(DOMHitTestResult.forElement(textNode, layoutBox));
          }
        } else if (!layoutBox.AsAnonymousBlockBox() && domNode) {
          if (layoutBox.AsInlineContainerBox()) {
            if (opt.hitTestLevel >= HitTestLevel.InlineBox) {
              hit.push(DOMHitTestResult.forElement(domNode, layoutBox));
            }
          } else {
            hit.push(DOMHitTestResult.forElement(domNode, layoutBox));
          }
        }

        let containerBox = layoutBox.AsContainerBox();
        if (containerBox) {
          const child = containerBox.child_boxes();
          for (let i = 0, len = child.length; i < len; i++) {
            toVisit.push(child[i]);
          }
        }
      }
    }
    return hit;
  }

  hitTestRTree(minX: number, minY: number, maxX: number, maxY: number): ITextBoxRTreeItem[] {
    return this.textRTree.search({ minX, minY, maxX, maxY });
  }

  getRTreeItemsByParagraph(p: Paragraph): ITextBoxRTreeItem[] {
    const items = this.textRTree.all().filter(item => item.box.paragraph === p);
    return items.sort((a, b) => a.minY < b.minY ? -1 : 1);
  }

  getParagraphOfNode(node: DOMNode): Optional<Paragraph> {
    const box = node.GetLayoutObject().box;
    if (!box.isTextBox()) return undefined;
    return box.paragraph;
  }
}

export interface HitTestOptions {
  hitTestLevel: HitTestLevel;
}

