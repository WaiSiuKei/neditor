import { Disposable, DisposableStore, IDisposable } from '../common/lifecycle';
import { TimeoutTimer } from '../common/async';
import * as platform from '../common/platform';
import { onUnexpectedError } from '../common/errors';
import * as event from '@neditor/core/base/common/event';
import { IKeyboardEvent, StandardKeyboardEvent } from './keyboardEvent';
import { KeyCode } from '../common/keyCodes';
import { IMouseEvent, StandardMouseEvent } from './mouseEvent';

export const EventType = {
  // Common
  PASTE: 'paste',
  // Mouse
  CLICK: 'click',
  AUXCLICK: 'auxclick',
  DBLCLICK: 'dblclick',
  MOUSE_UP: 'mouseup',
  MOUSE_DOWN: 'mousedown',
  MOUSE_OVER: 'mouseover',
  MOUSE_MOVE: 'mousemove',
  MOUSE_OUT: 'mouseout',
  MOUSE_ENTER: 'mouseenter',
  MOUSE_LEAVE: 'mouseleave',
  MOUSE_WHEEL: 'wheel',
  POINTER_UP: 'pointerup',
  POINTER_DOWN: 'pointerdown',
  POINTER_MOVE: 'pointermove',
  CONTEXT_MENU: 'contextmenu',
  WHEEL: 'wheel',
  // Keyboard
  KEY_DOWN: 'keydown',
  KEY_PRESS: 'keypress',
  KEY_UP: 'keyup',
  // HTML Document
  LOAD: 'load',
  BEFORE_UNLOAD: 'beforeunload',
  UNLOAD: 'unload',
  PAGE_SHOW: 'pageshow',
  PAGE_HIDE: 'pagehide',
  ABORT: 'abort',
  ERROR: 'error',
  RESIZE: 'resize',
  SCROLL: 'scroll',
  FULLSCREEN_CHANGE: 'fullscreenchange',
  WK_FULLSCREEN_CHANGE: 'webkitfullscreenchange',
  // Form
  SELECT: 'select',
  CHANGE: 'change',
  SUBMIT: 'submit',
  RESET: 'reset',
  FOCUS: 'focus',
  FOCUS_IN: 'focusin',
  FOCUS_OUT: 'focusout',
  BLUR: 'blur',
  INPUT: 'input',
  // Local Storage
  STORAGE: 'storage',
  // Drag
  DRAG_START: 'dragstart',
  DRAG: 'drag',
  DRAG_ENTER: 'dragenter',
  DRAG_LEAVE: 'dragleave',
  DRAG_OVER: 'dragover',
  DROP: 'drop',
  DRAG_END: 'dragend',
  // Page Visibility
  VISIBILITY_CHANGE: 'visibilitychange',
} as const;

class DomListener implements IDisposable {
  private _handler: (e: any) => void;
  private _node: EventTarget;
  private readonly _type: string;
  private readonly _options: boolean | AddEventListenerOptions;

  constructor(
    node: EventTarget,
    type: string,
    handler: (e: any) => void,
    options?: boolean | AddEventListenerOptions,
  ) {
    this._node = node;
    this._type = type;
    this._handler = handler;
    this._options = options || false;
    this._node.addEventListener(this._type, this._handler, this._options);
  }

  public dispose(): void {
    if (!this._handler) {
      // Already disposed
      return;
    }

    this._node.removeEventListener(this._type, this._handler, this._options);

    // Prevent leakers from holding on to the dom or handler func
    this._node = null!;
    this._handler = null!;
  }
}

export function addDisposableListener<K extends keyof GlobalEventHandlersEventMap>(
  node: EventTarget,
  type: K,
  handler: (event: GlobalEventHandlersEventMap[K]) => void,
  useCapture?: boolean,
): IDisposable;
export function addDisposableListener(
  node: EventTarget,
  type: string,
  handler: (event: any) => void,
  useCapture?: boolean,
): IDisposable;
export function addDisposableListener(
  node: EventTarget,
  type: string,
  handler: (event: any) => void,
  options: AddEventListenerOptions,
): IDisposable;
export function addDisposableListener(
  node: EventTarget,
  type: string,
  handler: (event: any) => void,
  useCaptureOrOptions?: boolean | AddEventListenerOptions,
): IDisposable {
  return new DomListener(node, type, handler, useCaptureOrOptions);
}

export interface DOMEvent {
  preventDefault(): void;
  stopPropagation(): void;
}

/**
 * Add a throttled listener. `handler` is fired at most every 8.33333ms or with the next animation frame (if browser supports it).
 */
export interface IEventMerger<R, E> {
  (lastEvent: R | null, currentEvent: E): R;
}

const MINIMUM_TIME_MS = 8;
const DEFAULT_EVENT_MERGER: IEventMerger<DOMEvent, DOMEvent> = function (
  lastEvent: DOMEvent | null,
  currentEvent: DOMEvent,
) {
  return currentEvent;
};

class TimeoutThrottledDomListener<R, E extends DOMEvent> extends Disposable {
  constructor(
    node: any,
    type: string,
    handler: (event: R) => void,
    eventMerger: IEventMerger<R, E> = <any>DEFAULT_EVENT_MERGER,
    minimumTimeMs: number = MINIMUM_TIME_MS,
  ) {
    super();

    let lastEvent: R | null = null;
    let lastHandlerTime = 0;
    const timeout = this._register(new TimeoutTimer());

    const invokeHandler = () => {
      lastHandlerTime = new Date().getTime();
      handler(<R>lastEvent);
      lastEvent = null;
    };

    this._register(
      addDisposableListener(node, type, (e) => {
        lastEvent = eventMerger(lastEvent, e);
        const elapsedTime = new Date().getTime() - lastHandlerTime;

        if (elapsedTime >= minimumTimeMs) {
          timeout.cancel();
          invokeHandler();
        } else {
          timeout.setIfNotSet(invokeHandler, minimumTimeMs - elapsedTime);
        }
      }),
    );
  }
}

export function addDisposableThrottledListener<R, E extends DOMEvent = DOMEvent>(
  node: any,
  type: string,
  handler: (event: R) => void,
  eventMerger?: IEventMerger<R, E>,
  minimumTimeMs?: number,
): IDisposable {
  return new TimeoutThrottledDomListener<R, E>(node, type, handler, eventMerger, minimumTimeMs);
}

export function addDisposableNonBubblingMouseOutListener(
  node: Element | Window,
  handler: (event: MouseEvent) => void,
): IDisposable {
  return addDisposableListener(node, EventType.MOUSE_OUT, (e: MouseEvent) => {
    // Mouse out bubbles, so this is an attempt to ignore faux mouse outs coming from children elements
    let toElement: Node | null = <Node>e.relatedTarget;
    while (toElement && toElement !== node) {
      toElement = toElement.parentNode;
    }
    if (toElement === node) {
      return;
    }

    handler(e);
  });
}

export function isShadowRoot(node: Node): node is ShadowRoot {
  return node && !!(<ShadowRoot>node).host && !!(<ShadowRoot>node).mode;
}

export function getShadowRoot(domNode: Node): ShadowRoot | null {
  while (domNode.parentNode) {
    if (domNode === document.body) {
      // reached the body
      return null;
    }
    domNode = domNode.parentNode;
  }
  return isShadowRoot(domNode) ? domNode : null;
}

export function isAncestor(testChild: Node | null, testAncestor: Node | null): boolean {
  while (testChild) {
    if (testChild === testAncestor) {
      return true;
    }
    testChild = testChild.parentNode;
  }

  return false;
}

export interface IDimension {
  readonly width: number;
  readonly height: number;
}

export class Dimension implements IDimension {
  static readonly None = new Dimension(0, 0);

  constructor(public readonly width: number, public readonly height: number) {
  }

  with(width: number = this.width, height: number = this.height): Dimension {
    if (width !== this.width || height !== this.height) {
      return new Dimension(width, height);
    } else {
      return this;
    }
  }

  static is(obj: unknown): obj is IDimension {
    return (
      typeof obj === 'object' &&
      typeof (<IDimension>obj).height === 'number' &&
      typeof (<IDimension>obj).width === 'number'
    );
  }

  static lift(obj: IDimension): Dimension {
    if (obj instanceof Dimension) {
      return obj;
    } else {
      return new Dimension(obj.width, obj.height);
    }
  }

  static equals(a: Dimension | undefined, b: Dimension | undefined): boolean {
    if (a === b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    return a.width === b.width && a.height === b.height;
  }
}

export function getClientArea(element: HTMLElement): Dimension {
  // Try with DOM clientWidth / clientHeight
  if (element !== document.body) {
    return new Dimension(element.clientWidth, element.clientHeight);
  }

  // If visual view port exits and it's on mobile, it should be used instead of window innerWidth / innerHeight, or document.body.clientWidth / document.body.clientHeight
  if (platform.isIOS && window.visualViewport) {
    return new Dimension(window.visualViewport.width, window.visualViewport.height);
  }

  // Try innerWidth / innerHeight
  if (window.innerWidth && window.innerHeight) {
    return new Dimension(window.innerWidth, window.innerHeight);
  }

  // Try with document.body.clientWidth / document.body.clientHeight
  if (document.body && document.body.clientWidth && document.body.clientHeight) {
    return new Dimension(document.body.clientWidth, document.body.clientHeight);
  }

  // Try with document.documentElement.clientWidth / document.documentElement.clientHeight
  if (
    document.documentElement &&
    document.documentElement.clientWidth &&
    document.documentElement.clientHeight
  ) {
    return new Dimension(
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    );
  }

  throw new Error('Unable to figure out browser width and height');
}

export function size(element: HTMLElement, width: number | null, height: number | null): void {
  if (typeof width === 'number') {
    element.style.width = `${width}px`;
  }

  if (typeof height === 'number') {
    element.style.height = `${height}px`;
  }
}

export function position(
  element: HTMLElement,
  top: number,
  right?: number,
  bottom?: number,
  left?: number,
  position = 'absolute',
): void {
  if (typeof top === 'number') {
    element.style.top = `${top}px`;
  }

  if (typeof right === 'number') {
    element.style.right = `${right}px`;
  }

  if (typeof bottom === 'number') {
    element.style.bottom = `${bottom}px`;
  }

  if (typeof left === 'number') {
    element.style.left = `${left}px`;
  }

  element.style.position = position;
}

const parentFlowToDataKey = 'parentFlowToElementId';

function getParentFlowToElement(node: HTMLElement): HTMLElement | null {
  const flowToParentId = node.dataset[parentFlowToDataKey];
  if (typeof flowToParentId === 'string') {
    return document.getElementById(flowToParentId);
  }
  return null;
}

/**
 * Check if `testAncestor` is an ancestor of `testChild`, observing the explicit
 * parents set by `setParentFlowTo`.
 */
export function isAncestorUsingFlowTo(testChild: Node, testAncestor: Node): boolean {
  let node: Node | null = testChild;
  while (node) {
    if (node === testAncestor) {
      return true;
    }

    if (node instanceof HTMLElement) {
      const flowToParentElement = getParentFlowToElement(node);
      if (flowToParentElement) {
        node = flowToParentElement;
        continue;
      }
    }
    node = node.parentNode;
  }

  return false;
}

interface IRequestAnimationFrame {
  (callback: (time: number) => void): number;
}

let _animationFrame: IRequestAnimationFrame | null = null;

function doRequestAnimationFrame(callback: (time: number) => void): number {
  if (!_animationFrame) {
    const emulatedRequestAnimationFrame = (callback: (time: number) => void): any => {
      return setTimeout(() => callback(new Date().getTime()), 0);
    };
    _animationFrame =
      self.requestAnimationFrame ||
      (<any>self).msRequestAnimationFrame ||
      (<any>self).webkitRequestAnimationFrame ||
      (<any>self).mozRequestAnimationFrame ||
      (<any>self).oRequestAnimationFrame ||
      emulatedRequestAnimationFrame;
  }
  return _animationFrame.call(self, callback);
}

/**
 * Schedule a callback to be run at the next animation frame.
 * This allows multiple parties to register callbacks that should run at the next animation frame.
 * If currently in an animation frame, `runner` will be executed immediately.
 * @return token that can be used to cancel the scheduled runner (only if `runner` was not executed immediately).
 */
export let runAtThisOrScheduleAtNextAnimationFrame: (
  runner: () => void,
  priority?: number,
) => IDisposable;
/**
 * Schedule a callback to be run at the next animation frame.
 * This allows multiple parties to register callbacks that should run at the next animation frame.
 * If currently in an animation frame, `runner` will be executed at the next animation frame.
 * @return token that can be used to cancel the scheduled runner.
 */
export let scheduleAtNextAnimationFrame: (runner: () => void, priority?: number) => IDisposable;

class AnimationFrameQueueItem implements IDisposable {
  private _runner: () => void;
  public priority: number;
  private _canceled: boolean;

  constructor(runner: () => void, priority = 0) {
    this._runner = runner;
    this.priority = priority;
    this._canceled = false;
  }

  public dispose(): void {
    this._canceled = true;
  }

  public execute(): void {
    if (this._canceled) {
      return;
    }

    try {
      this._runner();
    } catch (e) {
      onUnexpectedError(e);
    }
  }

  // Sort by priority (largest to lowest)
  public static sort(a: AnimationFrameQueueItem, b: AnimationFrameQueueItem): number {
    return b.priority - a.priority;
  }
}

(function () {
  /**
   * The runners scheduled at the next animation frame
   */
  let NEXT_QUEUE: AnimationFrameQueueItem[] = [];
  /**
   * The runners scheduled at the current animation frame
   */
  let CURRENT_QUEUE: AnimationFrameQueueItem[] | null = null;
  /**
   * A flag to keep track if the native requestAnimationFrame was already called
   */
  let animFrameRequested = false;
  /**
   * A flag to indicate if currently handling a native requestAnimationFrame callback
   */
  let inAnimationFrameRunner = false;

  const animationFrameRunner = () => {
    animFrameRequested = false;

    CURRENT_QUEUE = NEXT_QUEUE;
    NEXT_QUEUE = [];

    inAnimationFrameRunner = true;
    while (CURRENT_QUEUE.length > 0) {
      CURRENT_QUEUE.sort(AnimationFrameQueueItem.sort);
      const top = CURRENT_QUEUE.shift()!;
      top.execute();
    }
    inAnimationFrameRunner = false;
  };

  scheduleAtNextAnimationFrame = (runner: () => void, priority = 0) => {
    const item = new AnimationFrameQueueItem(runner, priority);
    NEXT_QUEUE.push(item);

    if (!animFrameRequested) {
      animFrameRequested = true;
      doRequestAnimationFrame(animationFrameRunner);
    }

    return item;
  };

  runAtThisOrScheduleAtNextAnimationFrame = (runner: () => void, priority?: number) => {
    if (inAnimationFrameRunner) {
      const item = new AnimationFrameQueueItem(runner, priority);
      CURRENT_QUEUE!.push(item);
      return item;
    } else {
      return scheduleAtNextAnimationFrame(runner, priority);
    }
  };
})();

export function domContentLoaded(): Promise<unknown> {
  return new Promise<unknown>((resolve) => {
    const readyState = document.readyState;
    if (readyState === 'complete' || (document && document.body !== null)) {
      resolve(undefined);
    } else {
      window.addEventListener('DOMContentLoaded', resolve, false);
    }
  });
}

export function createStyleSheet(
  container: HTMLElement = document.getElementsByTagName('head')[0],
): HTMLStyleElement {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.media = 'screen';
  container.appendChild(style);
  return style;
}

export function append<T extends Node>(parent: HTMLElement, child: T): T;
export function append<T extends Node>(parent: HTMLElement, ...children: (T | string)[]): void;
export function append<T extends Node>(parent: HTMLElement, ...children: (T | string)[]): T | void {
  parent.append(...children);
  if (children.length === 1 && typeof children[0] !== 'string') {
    return <T>children[0];
  }
}

export function prepend<T extends Node>(parent: HTMLElement, child: T): T {
  parent.insertBefore(child, parent.firstChild);
  return child;
}

export function show(...elements: HTMLElement[]): void {
  for (const element of elements) {
    element.style.display = '';
    element.removeAttribute('aria-hidden');
  }
}

export function hide(...elements: HTMLElement[]): void {
  for (const element of elements) {
    element.style.display = 'none';
    element.setAttribute('aria-hidden', 'true');
  }
}

const SELECTOR_REGEX = /([\w\-]+)?(#([\w\-]+))?((\.([\w\-]+))*)/;

export enum Namespace {
  HTML = 'http://www.w3.org/1999/xhtml',
  SVG = 'http://www.w3.org/2000/svg',
}

function _$<T extends Element>(
  namespace: Namespace,
  description: string,
  attrs?: { [key: string]: any },
  ...children: Array<Node | string>
): T {
  const match = SELECTOR_REGEX.exec(description);

  if (!match) {
    throw new Error('Bad use of emmet');
  }

  attrs = { ...(attrs || {}) };

  const tagName = match[1] || 'div';
  let result: T;

  if (namespace !== Namespace.HTML) {
    result = document.createElementNS(namespace as string, tagName) as T;
  } else {
    result = document.createElement(tagName) as unknown as T;
  }

  if (match[3]) {
    result.id = match[3];
  }
  if (match[4]) {
    result.className = match[4].replace(/\./g, ' ').trim();
  }

  Object.keys(attrs).forEach((name) => {
    const value = attrs![name];

    if (typeof value === 'undefined') {
      return;
    }

    if (/^on\w+$/.test(name)) {
      (<any>result)[name] = value;
    } else if (name === 'selected') {
      if (value) {
        result.setAttribute(name, 'true');
      }
    } else {
      result.setAttribute(name, value);
    }
  });

  result.append(...children);

  return result as T;
}

export function $<T extends HTMLElement>(
  description: string,
  attrs?: { [key: string]: any },
  ...children: Array<Node | string>
): T {
  return _$(Namespace.HTML, description, attrs, ...children);
}

export interface EventLike {
  preventDefault(): void;
  stopPropagation(): void;
}

export const EventHelper = {
  stop: function (e: EventLike, cancelBubble?: boolean) {
    if (e.preventDefault) {
      e.preventDefault();
    } else {
      // IE8
      (<any>e).returnValue = false;
    }

    if (cancelBubble) {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        // IE8
        (<any>e).cancelBubble = true;
      }
    }
  },
};

export function getElementsByTagName(tag: string): HTMLElement[] {
  return Array.prototype.slice.call(document.getElementsByTagName(tag), 0);
}

export interface IFocusTracker extends Disposable {
  onDidFocus: event.Event<void>;
  onDidBlur: event.Event<void>;
  refreshState(): void;
}

class FocusTracker extends Disposable implements IFocusTracker {
  private readonly _onDidFocus = this._register(new event.Emitter<void>());
  public readonly onDidFocus: event.Event<void> = this._onDidFocus.event;

  private readonly _onDidBlur = this._register(new event.Emitter<void>());
  public readonly onDidBlur: event.Event<void> = this._onDidBlur.event;

  private _refreshStateHandler: () => void;

  private static hasFocusWithin(element: HTMLElement): boolean {
    const shadowRoot = getShadowRoot(element);
    const activeElement = shadowRoot ? shadowRoot.activeElement : document.activeElement;
    return isAncestor(activeElement, element);
  }

  constructor(element: HTMLElement | Window) {
    super();
    let hasFocus = FocusTracker.hasFocusWithin(<HTMLElement>element);
    let loosingFocus = false;

    const onFocus = () => {
      loosingFocus = false;
      if (!hasFocus) {
        hasFocus = true;
        this._onDidFocus.fire();
      }
    };

    const onBlur = () => {
      if (hasFocus) {
        loosingFocus = true;
        window.setTimeout(() => {
          if (loosingFocus) {
            loosingFocus = false;
            hasFocus = false;
            this._onDidBlur.fire();
          }
        }, 0);
      }
    };

    this._refreshStateHandler = () => {
      const currentNodeHasFocus = FocusTracker.hasFocusWithin(<HTMLElement>element);
      if (currentNodeHasFocus !== hasFocus) {
        if (hasFocus) {
          onBlur();
        } else {
          onFocus();
        }
      }
    };

    this._register(addDisposableListener(element, EventType.FOCUS, onFocus, true));
    this._register(addDisposableListener(element, EventType.BLUR, onBlur, true));
    this._register(
      addDisposableListener(element, EventType.FOCUS_IN, () => this._refreshStateHandler()),
    );
    this._register(
      addDisposableListener(element, EventType.FOCUS_OUT, () => this._refreshStateHandler()),
    );
  }

  refreshState() {
    this._refreshStateHandler();
  }
}

export function trackFocus(element: HTMLElement | Window): IFocusTracker {
  return new FocusTracker(element);
}

export function clearNode(node: HTMLElement): void {
  while (node.firstChild) {
    node.firstChild.remove();
  }
}

type ModifierKey = 'alt' | 'ctrl' | 'shift' | 'meta';

export interface IModifierKeyStatus {
  altKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  lastKeyPressed?: ModifierKey;
  lastKeyReleased?: ModifierKey;
  event?: KeyboardEvent;
}

export class ModifierKeyEmitter extends event.Emitter<IModifierKeyStatus> {
  private readonly _subscriptions = new DisposableStore();
  private _keyStatus: IModifierKeyStatus;
  private static instance: ModifierKeyEmitter;

  private constructor() {
    super();

    this._keyStatus = {
      altKey: false,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    };

    this._subscriptions.add(
      addDisposableListener(
        window,
        'keydown',
        (e) => {
          if (e.defaultPrevented) {
            return;
          }

          const event = new StandardKeyboardEvent(e);
          // If Alt-key keydown event is repeated, ignore it #112347
          // Only known to be necessary for Alt-Key at the moment #115810
          if (event.keyCode === KeyCode.Alt && e.repeat) {
            return;
          }

          if (e.altKey && !this._keyStatus.altKey) {
            this._keyStatus.lastKeyPressed = 'alt';
          } else if (e.ctrlKey && !this._keyStatus.ctrlKey) {
            this._keyStatus.lastKeyPressed = 'ctrl';
          } else if (e.metaKey && !this._keyStatus.metaKey) {
            this._keyStatus.lastKeyPressed = 'meta';
          } else if (e.shiftKey && !this._keyStatus.shiftKey) {
            this._keyStatus.lastKeyPressed = 'shift';
          } else if (event.keyCode !== KeyCode.Alt) {
            this._keyStatus.lastKeyPressed = undefined;
          } else {
            return;
          }

          this._keyStatus.altKey = e.altKey;
          this._keyStatus.ctrlKey = e.ctrlKey;
          this._keyStatus.metaKey = e.metaKey;
          this._keyStatus.shiftKey = e.shiftKey;

          if (this._keyStatus.lastKeyPressed) {
            this._keyStatus.event = e;
            this.fire(this._keyStatus);
          }
        },
        true,
      ),
    );

    this._subscriptions.add(
      addDisposableListener(
        window,
        'keyup',
        (e) => {
          if (e.defaultPrevented) {
            return;
          }

          if (!e.altKey && this._keyStatus.altKey) {
            this._keyStatus.lastKeyReleased = 'alt';
          } else if (!e.ctrlKey && this._keyStatus.ctrlKey) {
            this._keyStatus.lastKeyReleased = 'ctrl';
          } else if (!e.metaKey && this._keyStatus.metaKey) {
            this._keyStatus.lastKeyReleased = 'meta';
          } else if (!e.shiftKey && this._keyStatus.shiftKey) {
            this._keyStatus.lastKeyReleased = 'shift';
          } else {
            this._keyStatus.lastKeyReleased = undefined;
          }

          if (this._keyStatus.lastKeyPressed !== this._keyStatus.lastKeyReleased) {
            this._keyStatus.lastKeyPressed = undefined;
          }

          this._keyStatus.altKey = e.altKey;
          this._keyStatus.ctrlKey = e.ctrlKey;
          this._keyStatus.metaKey = e.metaKey;
          this._keyStatus.shiftKey = e.shiftKey;

          if (this._keyStatus.lastKeyReleased) {
            this._keyStatus.event = e;
            this.fire(this._keyStatus);
          }
        },
        true,
      ),
    );

    this._subscriptions.add(
      addDisposableListener(
        document.body,
        'mousedown',
        () => {
          this._keyStatus.lastKeyPressed = undefined;
        },
        true,
      ),
    );

    this._subscriptions.add(
      addDisposableListener(
        document.body,
        'mouseup',
        () => {
          this._keyStatus.lastKeyPressed = undefined;
        },
        true,
      ),
    );

    this._subscriptions.add(
      addDisposableListener(
        document.body,
        'mousemove',
        (e) => {
          if (e.buttons) {
            this._keyStatus.lastKeyPressed = undefined;
          }
        },
        true,
      ),
    );

    this._subscriptions.add(
      addDisposableListener(window, 'blur', () => {
        this.resetKeyStatus();
      }),
    );
  }

  get keyStatus(): IModifierKeyStatus {
    return this._keyStatus;
  }

  get isModifierPressed(): boolean {
    return (
      this._keyStatus.altKey ||
      this._keyStatus.ctrlKey ||
      this._keyStatus.metaKey ||
      this._keyStatus.shiftKey
    );
  }

  /**
   * Allows to explicitly reset the key status based on more knowledge (#109062)
   */
  resetKeyStatus(): void {
    this.doResetKeyStatus();
    this.fire(this._keyStatus);
  }

  private doResetKeyStatus(): void {
    this._keyStatus = {
      altKey: false,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
    };
  }

  static getInstance() {
    if (!ModifierKeyEmitter.instance) {
      ModifierKeyEmitter.instance = new ModifierKeyEmitter();
    }

    return ModifierKeyEmitter.instance;
  }

  dispose() {
    super.dispose();
    this._subscriptions.dispose();
  }
}

// 获取符合条件的父节点 如果没有 返回null
export function findParentNode(
  target: HTMLElement,
  condition: (t: HTMLElement) => boolean,
): HTMLElement | null {
  const parent = target.parentElement;
  if (!parent) return null;
  const isValid = condition(parent);
  if (isValid) {
    return parent;
  } else {
    return findParentNode(parent, condition);
  }
}

// https://github.com/react-hook-form/react-hook-form/blob/master/src/utils/isHTMLElement.ts
export function isHTMLElement(value: unknown): value is HTMLElement {
  const owner = value ? ((value as HTMLElement).ownerDocument as Document) : 0;
  const ElementClass = owner && owner.defaultView ? owner.defaultView.HTMLElement : HTMLElement;
  // core 画布元素 el，由 iframe 上层的 document 创建，因此还要检测 el instanceof HTMLElement
  return value instanceof HTMLElement || value instanceof ElementClass;
}

export interface IAddStandardDisposableListenerSignature {
  (node: HTMLElement, type: 'click', handler: (event: IMouseEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: 'mousedown', handler: (event: IMouseEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: 'keydown', handler: (event: IKeyboardEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: 'keypress', handler: (event: IKeyboardEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: 'keyup', handler: (event: IKeyboardEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: 'pointerdown', handler: (event: PointerEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: 'pointermove', handler: (event: PointerEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: 'pointerup', handler: (event: PointerEvent) => void, useCapture?: boolean): IDisposable;
  (node: HTMLElement, type: string, handler: (event: any) => void, useCapture?: boolean): IDisposable;
}

function _wrapAsStandardMouseEvent(handler: (e: IMouseEvent) => void): (e: MouseEvent) => void {
  return function (e: MouseEvent) {
    return handler(new StandardMouseEvent(e));
  };
}

function _wrapAsStandardKeyboardEvent(handler: (e: IKeyboardEvent) => void): (e: KeyboardEvent) => void {
  return function (e: KeyboardEvent) {
    return handler(new StandardKeyboardEvent(e));
  };
}

export let addStandardDisposableListener: IAddStandardDisposableListenerSignature = function addStandardDisposableListener(node: HTMLElement, type: string, handler: (event: any) => void, useCapture?: boolean): IDisposable {
  let wrapHandler = handler;

  if (type === 'click' || type === 'mousedown') {
    wrapHandler = _wrapAsStandardMouseEvent(handler);
  } else if (type === 'keydown' || type === 'keypress' || type === 'keyup') {
    wrapHandler = _wrapAsStandardKeyboardEvent(handler);
  }

  return addDisposableListener(node, type, wrapHandler, useCapture);
};

export interface IDomNodePagePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface IStandardWindow {
  readonly scrollX: number;
  readonly scrollY: number;
}

export const StandardWindow: IStandardWindow = new class implements IStandardWindow {
  get scrollX(): number {
    if (typeof window.scrollX === 'number') {
      // modern browsers
      return window.scrollX;
    } else {
      return document.body.scrollLeft + document.documentElement!.scrollLeft;
    }
  }

  get scrollY(): number {
    if (typeof window.scrollY === 'number') {
      // modern browsers
      return window.scrollY;
    } else {
      return document.body.scrollTop + document.documentElement!.scrollTop;
    }
  }
};

/**
 * Returns the position of a dom node relative to the entire page.
 */
export function getDomNodePagePosition(domNode: HTMLElement): IDomNodePagePosition {
  let bb = domNode.getBoundingClientRect();
  return {
    left: bb.left + StandardWindow.scrollX,
    top: bb.top + StandardWindow.scrollY,
    width: bb.width,
    height: bb.height
  };
}

export function saveParentsScrollTop(node: Element): number[] {
  let r: number[] = [];
  for (let i = 0; node && node.nodeType === node.ELEMENT_NODE; i++) {
    r[i] = node.scrollTop;
    node = <Element>node.parentNode;
  }
  return r;
}

export function restoreParentsScrollTop(node: Element, state: number[]): void {
  for (let i = 0; node && node.nodeType === node.ELEMENT_NODE; i++) {
    if (node.scrollTop !== state[i]) {
      node.scrollTop = state[i];
    }
    node = <Element>node.parentNode;
  }
}

export function isInDOM(node: Node | null): boolean {
  while (node) {
    if (node === document.body) {
      return true;
    }
    node = node.parentNode || (node as ShadowRoot).host;
  }
  return false;
}
