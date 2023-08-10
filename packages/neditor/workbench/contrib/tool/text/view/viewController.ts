import { IKeyboardEvent } from '../../../../../base/browser/keyboardEvent';
import { OS } from '../../../../../base/browser/platform';
import { DCHECK } from '../../../../../base/check';
import { createSimpleKeybinding, KeyCode, KeyMod, ResolvedKeybinding, SimpleKeybinding } from '../../../../../base/common/keyCodes';
import { Disposable } from '../../../../../base/common/lifecycle';
import { NOTIMPLEMENTED } from '../../../../../base/common/notreached';
import { Optional } from '../../../../../base/common/typescript';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { HTMLElement } from '../../../../../engine/dom/html_element';
import { HTMLSpanElement } from '../../../../../engine/dom/html_span_element';
import { IKeybindingService } from '../../../../../platform/keybinding/common/keybinding';
import { IToolService } from '../../../../../platform/tool/common/tool';
import { Editor, Point, Range, Node, Path, Transforms } from '../editor';
import { DOMElement, DOMNode, DOMRange, DOMSelection, isDOMElement, isDOMSelection, normalizeDOMPoint, DOMPoint } from '../utils/dom';
import { ELEMENT_TO_NODE } from '../utils/weak-maps';

type KeybindingHandler = () => void

export class ViewController extends Disposable {
  _keybindings = new Map<SimpleKeybinding, KeybindingHandler>();
  _canvasEditor = new CanvasEditor();
  constructor(
    private editor: Editor,
    private canvas: ICanvas,
    private onEsc: () => void,
  ) {
    super();
    this._initKeybindings();
    this._registerEvent();
    // 处理初始的 selection 状态
    this._onDOMSelectionChange();
  }

  private _initKeybindings() {
    this._registerKeybinding(KeyCode.Escape, this._onEsc);
    this._registerKeybinding(KeyMod.CtrlCmd | KeyCode.KEY_A, this._onSelectAll);
    this._registerKeybinding(KeyCode.Backspace, this._onDeleteBackward);
    this._registerKeybinding(KeyCode.Delete, this._onDeleteBackward);
  }

  private _registerKeybinding(kb: number, func: KeybindingHandler) {
    const keybinding = createSimpleKeybinding(kb, OS);
    this._keybindings.set(keybinding, func);
  }

  private resolveKeybinding(e: IKeyboardEvent) {
    return this.canvas.invokeWithinContext(accessor => {
      const keybindingService = accessor.get<IKeybindingService>(IKeybindingService);
      return keybindingService.resolveKeyboardEvent(e);
    });
  }

  //#region keybinding handlers
  private _onEsc() {
    this.onEsc();
    this.canvas.view.document.getSelection().removeAllRanges();
    this.canvas.invokeWithinContext(accessor => {
      const toolService = accessor.get<IToolService>(IToolService);
      toolService.switchDefault();
    });
  }

  private _onSelectAll() {
    console.log('select all');
  }

  private _onDeleteBackward() {
    const { editor } = this;
    const { selection } = editor;
    if (selection && Range.isExpanded(selection)) {
      Editor.deleteFragment(editor, { direction: 'backward' });
    } else {
      Editor.deleteBackward(editor);
    }
  }
  //#endregion

  //#region event
  private _registerEvent() {
    const selection = this.canvas.view.document.getSelection();
    this._register(selection.onDidChange(() => this._onDOMSelectionChange()));
  }
  private _onDOMSelectionChange() {
    const domSelection = this.canvas.view.document.getSelection();
    console.log('selection changed', domSelection);
    const range = this._canvasEditor.toSlateRange(this.editor, domSelection, {
      exactMatch: false,
      suppressThrow: true,
    });

    if (range) {
      // if (
      //   !ReactEditor.isComposing(editor) &&
      //   !androidInputManager?.hasPendingChanges() &&
      //   !androidInputManager?.isFlushing()
      // ) {
      Transforms.select(this.editor, range);
      // } else {
      //   androidInputManager?.handleUserSelect(range)
      // }
    }
  }
  //#endregion

  public type(text: string): void {
    // const { view } = this;
    // if (!/[\r\n]/.test(text)) {
    //   view.dispatch(view.state.tr.insertText(text));
    // }
  }

  public compositionType(text: string, replacePrevCharCnt: number, replaceNextCharCnt: number, positionDelta: number): void {
    DCHECK(!replaceNextCharCnt);
    DCHECK(!positionDelta);

    // const { view } = this;
    // const { state } = view;
    // let { tr, selection } = state;
    // const { head } = selection;
    // if (replacePrevCharCnt) {
    //   tr.delete(head - replacePrevCharCnt, head);
    // }
    // tr.insertText(text);
    // view.dispatch(tr);
  }

  public compositionStart(): void {
    // const { view } = this;
    // const { state } = view;
    // const { selection } = state;
    // if (!selection.empty) {
    //   let { tr } = state;
    //   view.dispatch(tr.deleteSelection());
    // }
    // DCHECK(selection.empty);
  }

  public compositionEnd(): void {
  }

  public keyDown(event: IKeyboardEvent): void {
    const keybinding = event.toKeybinding();
    for (let [k, handler] of this._keybindings.entries()) {
      if (keybinding.equals(k)) {
        handler.call(this);
        return;
      }
    }
    console.log('keydown', this.resolveKeybinding(event).getLabel());
  };

  public focus() {
    // console.log('focus');
  }

  public blur() {
    // console.log('blur');
    // this._handleEsc();
  }
}

class CanvasEditor {
  constructor() {}
  toSlateRange<T extends boolean>(
    editor: Editor,
    domRange: DOMRange | DOMSelection,
    options: {
      exactMatch: boolean
      suppressThrow: T
    }
  ): T extends true ? Range | null : Range {
    const { exactMatch, suppressThrow } = options;
    const el = isDOMSelection(domRange)
      ? domRange.anchorNode
      : domRange.startContainer;
    let anchorNode: Optional<DOMNode | null>;
    let anchorOffset: Optional<number>;
    let focusNode: Optional<DOMNode | null>;
    let focusOffset: Optional<number>;
    let isCollapsed: Optional<boolean>;

    if (el) {
      if (isDOMSelection(domRange)) {
        // COMPAT: In firefox the normal seletion way does not work
        // (https://github.com/ianstormtaylor/slate/pull/5486#issue-1820720223)
        if (domRange.rangeCount > 1) {
          NOTIMPLEMENTED();
        }
        anchorNode = domRange.anchorNode;
        anchorOffset = domRange.anchorOffset;
        focusNode = domRange.focusNode;
        focusOffset = domRange.focusOffset;
        isCollapsed = domRange.isCollapsed;
      } else {
        anchorNode = domRange.startContainer;
        anchorOffset = domRange.startOffset;
        focusNode = domRange.endContainer;
        focusOffset = domRange.endOffset;
        isCollapsed = domRange.collapsed;
      }
    }

    if (
      anchorNode == null ||
      focusNode == null ||
      anchorOffset == null ||
      focusOffset == null
    ) {
      throw new Error(
        `Cannot resolve a Slate range from DOM range: ${domRange}`
      );
    }

    // COMPAT: Triple-clicking a word in chrome will sometimes place the focus
    // inside a `contenteditable="false"` DOM node following the word, which
    // will cause `toSlatePoint` to throw an error. (2023/03/07)
    // if (
    //   'getAttribute' in focusNode &&
    //   (focusNode as HTMLElement).getAttribute('contenteditable') === 'false' &&
    //   (focusNode as HTMLElement).getAttribute('data-slate-void') !== 'true'
    // ) {
    //   focusNode = anchorNode
    //   focusOffset = anchorNode.textContent?.length || 0
    // }

    const anchor = this.toSlatePoint(
      editor,
      [anchorNode, anchorOffset],
      {
        exactMatch,
        suppressThrow,
      }
    );
    if (!anchor) {
      return null as T extends true ? Range | null : Range;
    }

    const focus = isCollapsed
      ? anchor
      : this.toSlatePoint(editor, [focusNode, focusOffset], {
        exactMatch,
        suppressThrow,
      });
    if (!focus) {
      return null as T extends true ? Range | null : Range;
    }

    let range: Range = { anchor: anchor as Point, focus: focus as Point };
    // if the selection is a hanging range that ends in a void
    // and the DOM focus is an Element
    // (meaning that the selection ends before the element)
    // unhang the range to avoid mistakenly including the void
    if (
      Range.isExpanded(range) &&
      Range.isForward(range) &&
      isDOMElement(focusNode) &&
      Editor.void(editor, { at: range.focus, mode: 'highest' })
    ) {
      range = Editor.unhangRange(editor, range, { voids: true });
    }

    return (range as unknown) as T extends true ? Range | null : Range;
  }

  toSlatePoint<T extends boolean>(
    editor: Editor,
    domPoint: DOMPoint,
    options: {
      exactMatch: boolean
      suppressThrow: T
    }
  ): T extends true ? Point | null : Point {
    const { exactMatch, suppressThrow } = options;
    const [nearestNode, nearestOffset] = exactMatch
      ? domPoint
      : normalizeDOMPoint(domPoint);
    const parentNode = nearestNode.parentNode as DOMElement;
    let textNode: DOMElement | null = null;
    let offset = 0;

    DCHECK(parentNode.firstChild === nearestNode);
    DCHECK(parentNode.tagName === HTMLSpanElement.kTagName);
    offset = nearestOffset;
    textNode = parentNode;

    if (!textNode) {
      if (suppressThrow) {
        return null as T extends true ? Point | null : Point;
      }
      throw new Error(
        `Cannot resolve a Slate point from DOM point: ${domPoint}`
      );
    }

    // COMPAT: If someone is clicking from one Slate editor into another,
    // the select event fires twice, once for the old editor's `element`
    // first, and then afterwards for the correct `element`. (2017/03/03)
    const slateNode = this.toSlateNode(editor, textNode!);
    const path = this.findPath(editor, slateNode);
    return { path, offset } as T extends true ? Point | null : Point;
  }

  toDOMNode(editor: Editor, node: Node): HTMLElement {
    if (Editor.isEditor(node)) return editor.el;
    return NOTIMPLEMENTED();
    // const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor)
    // const domNode = Editor.isEditor(node)
    //   ? EDITOR_TO_ELEMENT.get(editor)
    //   : KEY_TO_ELEMENT?.get(ReactEditor.findKey(editor, node))
    //
    // if (!domNode) {
    //   throw new Error(
    //     `Cannot resolve a DOM node from Slate node: ${Scrubber.stringify(node)}`
    //   )
    // }
    //
    // return domNode
  }

  toSlateNode(editor: Editor, domNode: DOMNode) {
    let domEl = isDOMElement(domNode) ? domNode : domNode.parentElement;

    if (domEl && domEl.tagName === HTMLSpanElement.kTagName) {
      domEl = domEl.parentElement!;
    }

    const node = domEl ? ELEMENT_TO_NODE.get(domEl as HTMLElement) : null;

    if (!node) {
      throw new Error(`Cannot resolve a Slate node from DOM node: ${domEl}`);
    }

    return node;
  }

  findPath(editor: Editor, node: Node): Path {
    NOTIMPLEMENTED();
  }
}
