import { ConstructionType, Node, NodeType, NodeVisitor } from './node';
import { Node as RenderTreeNode } from '../render_tree/node';
import { ElementFactory } from './element_factory';
import { Text } from './text';
import { TRACE_EVENT0 } from '@neditor/core/base/trace_event/common/trace_event_common';
import type { Window } from './window';
import type { ViewportSize } from '../cssom/viewport_size';
import type { HTMLElementContext } from './html_element_context';
import { ComputedStyleDeclaration } from '../cssom/computed_style_declaration';
import { DCHECK } from '@neditor/core/base/check';
import { ComputedStyleData } from '../cssom/computed_style_data';
import { Element } from './element';
import { CreateInitialComputedStyle } from '../cssom/initial_computed_style';
import { BasicClock, SystemMonotonicClock } from '../base/clock';
import { FontCache } from './font_cache';
import { DCHECK_EQ, DCHECK_GT } from '@neditor/core/base/check_op';
import { AncestorsAreDisplayed, HTMLElement } from './html_element';
import { DocumentTimeline } from './document_timeline';
import type { HTMLHtmlElement } from './html_html_element';
import type { HTMLBodyElement } from './html_body_element';
import { kBenchmarkStatUpdateComputedStyles } from './benchmark_stat_names';
import { NOTREACHED } from '@neditor/core/base/common/notreached';
import { Optional } from '@neditor/core/base/common/typescript';
import { ContainerNode } from './container_node';
import { Selection } from '../editing/selection';
import { Range } from './range';

export abstract class DocumentObserver {
  abstract OnLoad(): void
  abstract OnMutation(): void
}

export class Options {
  constructor(
    public window: Window,
    public navigation_start_clock: BasicClock,
    public viewport_size: ViewportSize,
    public dom_max_element_depth: number,
  ) {
  }
}

export class Document extends ContainerNode {
  private html_element_factory_ = new ElementFactory();
  private observers_: DocumentObserver[] = [];
  private html_element_context_: HTMLElementContext;
  private window_: Window;
  private viewport_size_?: ViewportSize;
  private font_cache_: FontCache;

  private is_computed_style_dirty_: boolean = true;
  private initial_computed_style_declaration_ = new ComputedStyleDeclaration();
  private initial_computed_style_data_: ComputedStyleData | null = null;
  private dom_max_element_depth_: number;
  private default_timeline_: DocumentTimeline;
  private navigation_start_clock_: BasicClock;
  // The number of ongoing loadings.
  private loading_counter_: number = 0;
  // Whether the load event should be dispatched when loading counter hits zero.
  private should_dispatch_load_event_ = true;
  private synchronous_layout_callback_?: Function;
  private synchronous_layout_and_produce_render_tree_callback_?: () => RenderTreeNode;

  private elements_by_id = new Map<string, Element>();

  constructor(
    html_element_context: HTMLElementContext,
    options: Options,
  ) {
    super(ConstructionType.kCreateDocument);
    DCHECK(html_element_context);
    this.html_element_context_ = html_element_context;
    this.window_ = options.window;
    this.dom_max_element_depth_ = options.dom_max_element_depth;
    this.node_document_ = this;
    if (options.viewport_size) {
      this.SetViewport(options.viewport_size);
    }
    this.font_cache_ = new FontCache(
      html_element_context.resource_provider(),
      html_element_context.remote_typeface_cache(),
      this.OnTypefaceLoadEvent.bind(this),
      html_element_context.font_language_script()
    );
    this.navigation_start_clock_ = options.navigation_start_clock || new SystemMonotonicClock();
    this.default_timeline_ = new DocumentTimeline(this, 0);

    // Call OnInsertedIntoDocument() immediately to ensure that the Document
    // object itself is considered to be "in the document".
    this.OnInsertedIntoDocument();
  }

  Accept(visitor: NodeVisitor): void {
    visitor.VisitDocument(this);
  }
  getNodeType(): NodeType {
    return NodeType.kDocumentNode;
  }
  get nodeName() {
    return '#document';
  }
  OnDOMMutation(): void {
    TRACE_EVENT0('cobalt.dom', 'Document.OnDOMMutation()');
    // Something in the document's DOM has been modified, but we don't know what,
    // so set the flag indicating that computed styles need to be updated.
    this.is_computed_style_dirty_ = true;

    this.RecordMutation();
  }
  OnTypefaceLoadEvent() {
    this.documentElement?.InvalidateLayoutBoxesOfNodeAndDescendants();
    this.RecordMutation();
  }
  createElement<T extends HTMLElement>(local_name: string) {
    let lower_local_name = local_name.toLocaleLowerCase();
    return this.html_element_factory_.CreateElement(this, lower_local_name) as T;
  }
  createTextNode(data: string): Text {
    return new Text(this, data);
  }
  get documentElement(): Optional<HTMLHtmlElement> {
    // The html element of a document is the document's root element, if there is
    // one and it's an html element, or null otherwise.
    //   https://www.w3.org/TR/html50/dom.html#the-html-element-0
    return this.first_element_child()! as HTMLHtmlElement;
  }

  private _selection: Optional<Selection>;
  getSelection(): Selection {
    if (!this._selection) {
      this._selection = new Selection(this);
    }
    return this._selection;
  }
  createRange(): Range {
    return new Range(this, this, 0, this, 0);
  }
  get body(): HTMLBodyElement | null {
    // The body element of a document is the first child of the html element that
    // is either a body element or a frameset element. If there is no such
    // element, it is null.
    // https://www.w3.org/TR/html50/dom.html#the-body-element-0
    let html_element = this.documentElement;
    if (!html_element) {
      return null;
    }
    for (let child = html_element.first_element_child(); child;
         child = child.nextElementSibling) {
      let child_html_element = child.AsHTMLElement();
      if (child_html_element) {
        let body_element = child_html_element.AsHTMLBodyElement();
        if (body_element) {
          return body_element;
        }
      }
    }
    return null;
  }
  font_cache() {
    return this.font_cache_;
  }
  IsXMLDocument() {
    return false;
  }
  SetViewport(viewport_size: ViewportSize) {
    if (this.viewport_size_ && this.viewport_size_ == viewport_size) {
      return;
    }
    this.viewport_size_ = viewport_size;
    this.initial_computed_style_data_ = CreateInitialComputedStyle(this.viewport_size_.width_height());
    this.initial_computed_style_declaration_.SetData(this.initial_computed_style_data_);

    this.is_computed_style_dirty_ = true;

    if (this.documentElement) {
      this.documentElement.InvalidateComputedStylesOfNodeAndDescendants();
    }
    this.RecordMutation();
  }
  navigation_start_clock() {
    return this.navigation_start_clock_;
  }
  initial_computed_style_data() {
    return this.initial_computed_style_data_;
  }
  dom_max_element_depth() {
    return this.dom_max_element_depth_;
  }
  html_element_context() {
    return this.html_element_context_;
  }

  // Count all ongoing loadings, including document itself and its dependent
  // resources, and dispatch OnLoad() if necessary.
  IncreaseLoadingCounter() {
    ++this.loading_counter_;
  }
  DecreaseLoadingCounter() {
    --this.loading_counter_;
  }
  DecreaseLoadingCounterAndMaybeDispatchLoadEvent() {
    DCHECK_GT(this.loading_counter_, 0);
    this.loading_counter_--;
    if (this.loading_counter_ == 0 && this.should_dispatch_load_event_) {
      // DCHECK(base::MessageLoop::current());
      this.should_dispatch_load_event_ = false;

      this.DispatchOnLoadEvent();
      // HTMLBodyElement* body_element = body().get();
      // if (body_element) {
      //   body_element->PostToDispatchEventName(FROM_HERE, base::Tokens::load());
      // }
    }
  }

  AddObserver(observer: DocumentObserver) {
    this.observers_.push(observer);
  }
  RecordMutation() {
    TRACE_EVENT0('cobalt::dom', 'Document::RecordMutation()');

    this.observers_.forEach(o => o.OnMutation());
  }
  SetSynchronousLayoutCallback(synchronous_layout_callback: Function) {
    this.synchronous_layout_callback_ = synchronous_layout_callback;
  }
  SetSynchronousLayoutAndProduceRenderTreeCallback(
    synchronous_layout_and_produce_render_tree_callback: () => RenderTreeNode) {
    this.synchronous_layout_and_produce_render_tree_callback_ =
      synchronous_layout_and_produce_render_tree_callback;
  }
  UpdateComputedStyles() {
    TRACE_EVENT0('cobalt::dom', 'Document::UpdateComputedStyles()');

    // UpdateSelectorTree();
    // UpdateKeyframes();
    // this.UpdateFontFaces();

    if (this.is_computed_style_dirty_) {
      TRACE_EVENT0('cobalt::layout', kBenchmarkStatUpdateComputedStyles);
//       base::StopWatch stop_watch_update_compute_style(
//         DomStatTracker::kStopWatchTypeUpdateComputedStyle,
//         base::StopWatch::kAutoStartOn,
//         html_element_context_.dom_stat_tracker());

      // Determine the official time that this style change event took place. This
      // is needed (as opposed to repeatedly calling base::Time::Now()) because
      // all animations that may be triggered here must start at the exact same
      // time if they were triggered in the same style change event.
      //   https://www.w3.org/TR/css3-transitions/#starting
      // let style_change_event_time = TimeDelta.FromMilliseconds(this.default_timeline_.current_time());

      let root = this.documentElement as HTMLElement;
      if (root) {
        DCHECK_EQ(this, root.parentNode);
        // First, update the matching rules for all elements.
        // root.UpdateMatchingRulesRecursively();

        // Then, update the computed style for the root element.
        root.UpdateComputedStyle(
          this.initial_computed_style_declaration_,
          this.initial_computed_style_data_!,
          // style_change_event_time,
          AncestorsAreDisplayed.kAncestorsAreDisplayed);

        // Finally, update the computed styles for the other elements.
        root.UpdateComputedStyleRecursively(
          root.computed_style_declaration(),
          root.computed_style()!,
          // style_change_event_time,
          true,
          0 /* current_element_depth */);
      }

      this.is_computed_style_dirty_ = false;
    }
  }

  // private UpdateFontFaces() {
  //   TRACE_EVENT0('cobalt::dom', 'Document::UpdateFontFaces()');
  //   if (this.are_font_faces_dirty_) {
  //     // let font_face_updater = new FontFaceUpdater(this.font_cache_);
  //     // font_face_updater.ProcessCSSStyleSheet(user_agent_style_sheet_);
  //     // font_face_updater.ProcessStyleSheetList(style_sheets());
  //     // font_face_updater.update();
  //     this.are_font_faces_dirty_ = false;
  //   }
  // }

  viewport_size(): ViewportSize {
    return this.viewport_size_!;
  }

  // Manages the clock used by Web Animations.
  //     https://www.w3.org/TR/web-animations
  // This clock is also used for requestAnimationFrame() callbacks, according
  // to the specification above.
  SampleTimelineTime() {
    this.default_timeline_.Sample();
  }

  // Web Animations API
  // https://www.w3.org/TR/2015/WD-web-animations-1-20150707/#extensions-to-the-document-interface
  timeline(): DocumentTimeline {
    return this.default_timeline_;
  }

  DispatchOnLoadEvent() {
    TRACE_EVENT0('cobalt::dom', 'Document::DispatchOnLoadEvent()');

    // if (HasBrowsingContext()) {
    //   // Update the current timeline sample time and then update computed styles
    //   // before dispatching the onload event.  This guarantees that computed
    //   // styles have been calculated before JavaScript executes onload event
    //   // handlers, which may wish to start a CSS Transition (requiring that
    //   // computed values previously exist).
    //   SampleTimelineTime();
    //   UpdateComputedStyles();
    // }

    // Adjust the document ready state to reflect the fact that the document has
    // finished loading.  Performing this update and firing the readystatechange
    // event before the load event matches Chromium's behavior.
    // ready_state_ = kDocumentReadyStateComplete;

    // Dispatch the readystatechange event (before the load event), since we
    // have changed the document ready state.
    // DispatchEvent(new Event(base::Tokens::readystatechange()));

    // Dispatch the document's onload event.
    // DispatchEvent(new Event(base::Tokens::load()));

    // After all JavaScript OnLoad event handlers have executed, signal to let
    // any Document observers know that a load event has occurred.
    this.SignalOnLoadToObservers();
  }

  private SignalOnLoadToObservers() {
    this.observers_.forEach(observer => observer.OnLoad());
  }
  Duplicate(): Node {
    NOTREACHED();
  }

  onNodeInserted(n: Node) {
    if (n.IsElement()) {
      const id = n.id;
      if (!id) return;
      this.elements_by_id.set(id, n);
    }
  }

  onNodeRemoved(n: Node) {
    if (n.IsElement()) {
      const id = n.id;
      if (!id) return;
      const record = this.elements_by_id.get(id);
      DCHECK(record);
      if (record === n) this.elements_by_id.delete(id);
    }
  }

  OnElementInlineStyleMutation() {
    this.is_computed_style_dirty_ = true;

    this.RecordMutation();
  }

  getElementById(id: string) {
    return this.elements_by_id.get(id);
  }
}
