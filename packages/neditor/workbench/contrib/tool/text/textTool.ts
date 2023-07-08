import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { InputEventType, IMouseInputEvent, InputEvents } from '@neditor/core/platform/input/browser/event';
import { BaseTool } from '@neditor/core/platform/tool/browser/baseTool';
import { ITool, IToolFactory, IToolService, ToolActivationShortcut } from '@neditor/core/platform/tool/common/tool';
import { DCHECK } from '../../../../base/check';
import { tail } from '../../../../base/common/array';
import { NOTREACHED } from '../../../../base/common/notreached';
import { assertValue } from '../../../../base/common/type';
import { Optional } from '../../../../base/common/typescript';
import { ScopedIdentifier } from '../../../../canvas/canvasCommon/scope';
import { AttrNameOfId, getScope } from '../../../../canvas/viewModel/path';
import { Node } from '../../../../engine/dom/node';
import { NodeTraversal } from '../../../../engine/dom/node_traversal';
import { ITextBoxRTreeItem } from '../../../../engine/layout/r_tree';
import { HitTestLevel } from '../../../../platform/input/common/input';
import { CanvasUpdater } from './canvasUpdaterImpl';
import { baseKeymap } from './commands';
import { TextAreaHandler } from './controller/textAreaHandler';
import { ViewController } from './view/viewController';
import { keymapPlugin } from './keymap';
import { EditorState } from './state/state';
import { defaultSchema } from './model/defaultSchema';
import { Node as EditorNode } from './model';
import { IEditorView } from './view/view';
import { EditorView } from './view/viewImpl';

function isInlineText(n: Node) {
  if (n.IsText()) return true;
  return false;
}

function isParagraph(n: Node) {
  return n.IsElement() && n.firstChild && isInlineText(n.firstChild);
}

function isParagraphContainer(n: Node) {
  return n.IsElement() && n.firstChild && isParagraph(n.firstChild);
}

function getParagraphContainer(n: Node): Node {
  DCHECK(n.IsText());
  return n.parentNode!.parentNode!;
}

export class TextTool extends BaseTool {
  _editorView?: IEditorView;
  anchorY: Optional<number>;
  anchorX: Optional<number>;
  private _textAreaHandler: Optional<TextAreaHandler>;

  get id(): string {
    return TextToolID;
  }
  activate() {
    this.canvas.view.setHitTestLevel(HitTestLevel.InlineBox);
  }

  deactivate() {
    this.canvas.view.setHitTestLevel(HitTestLevel.BlockBox);
    this._disposeEditor();
    this.canvas.view.focus();
  }

  processEvent(event: InputEvents) {
    const mouseEvent = event.asMouseInputEvent();
    const { type } = event;
    if (type === InputEventType.MOUSE_ENTER) {
      assertValue(mouseEvent);
      this.handleMouseEnter(mouseEvent);
      event.accept();
    }
    if (type === InputEventType.MOUSE_DOWN) {
      assertValue(mouseEvent);
      this.handleMouseDown(mouseEvent);
      event.accept();
    }
    if (type === InputEventType.DBLCLICK) {
      DCHECK(mouseEvent);
      this.handleDBClick(mouseEvent);
      event.accept();
    }
    if (type === InputEventType.DRAG) {
      assertValue(mouseEvent);
      this.handleDrag(mouseEvent);
      event.accept();
    }
    if (type === InputEventType.DROP) {
      assertValue(mouseEvent);
      this.handleDrop(mouseEvent);
      event.accept();
    }
  }
  handleDBClick(e: IMouseInputEvent) {
    this._handleClick(e);
  }
  handleMouseEnter(e: IMouseInputEvent) {
    const { node } = tail(e.targetPath);
    assertValue(node);
    if (isInlineText(node) || isParagraph(node)) {
      this.useCursor(CursorStyle.text);
    } else {
      this.useCursor(CursorStyle.arrow);
    }
  }
  handleMouseDown(e: IMouseInputEvent) {
    const shouldExit = this._handleClick(e);
    if (shouldExit) {
      this.canvas.invokeWithinContext(accessor => {
        const toolService = accessor.get<IToolService>(IToolService);
        toolService.switchDefault();
      });
    }
  }
  handleDrag(e: IMouseInputEvent) {
    this._updateSelection(e);
  }
  handleDrop(e: IMouseInputEvent) {
  }

  private _handleClick(e: IMouseInputEvent): boolean {
    this.anchorX = e.clientX;
    this.anchorY = e.clientY;
    let prevAnchor = this.canvas.view.document.getSelection().anchorNode;
    this._editorView?.domObserver.stop();
    this._updateSelection(e);
    this._editorView?.domObserver.start();
    let curAnchor = this.canvas.view.document.getSelection().anchorNode;

    if (this._editorView && !curAnchor) {
      DCHECK(prevAnchor);
      this._disposeEditor();
      return true;
    }

    if (!this._editorView && curAnchor) {
      DCHECK(!prevAnchor);
      this._initEditor(curAnchor);
      return false;
    }

    DCHECK(prevAnchor);
    DCHECK(curAnchor);

    const ancestor = NodeTraversal.CommonAncestor(prevAnchor, curAnchor);
    DCHECK(ancestor);
    DCHECK(this._editorView);
    if (ancestor === prevAnchor) {
      this._editorView.domObserver.flush();
      return false;
    }
    if (isParagraphContainer(ancestor)) {
      this._editorView.domObserver.flush();
      return false;
    }
    this._disposeEditor();
    this._initEditor(curAnchor);
    return false;
  }

  private _disposeEditor() {
    if (this._editorView) {
      this._editorView.dispose();
      this._editorView = undefined;
    }
    if (this._textAreaHandler) {
      this._textAreaHandler.dispose();
      this._textAreaHandler = undefined;
    }
  }

  private _triggerEndEditing() {
    this._disposeEditor();
    this.canvas.view.document.getSelection().removeAllRanges();
    this.canvas.invokeWithinContext(accessor => {
      const toolService = accessor.get<IToolService>(IToolService);
      toolService.switchDefault();
    });
  }

  private _updateSelection(e: IMouseInputEvent) {
    const anchorX = this.anchorX!;
    const anchorY = this.anchorY!;
    const { clientX, clientY } = e;
    if (anchorX === clientX && anchorY === clientY) {
      return this._updateCollapsedSelect(anchorX, anchorY);
    }
    const firstAsMin = anchorY <= clientY;
    const minX = firstAsMin ? anchorX : clientX;
    const minY = firstAsMin ? anchorY : clientY;
    const maxX = firstAsMin ? clientX : anchorX;
    const maxY = firstAsMin ? clientY : anchorY;
    const selection = this.canvas.view.document.getSelection();
    const anchorItems = this.canvas.view.layoutManager.hitTestRTree(anchorX, anchorY, anchorX, anchorY);
    if (!anchorItems.length) {
      selection.removeAllRanges();
      return;
    }
    /**
     * point1: 这里不能简单使用矩形相交的方式获得划中的 textbox,可能段落最后有一个长度比其他这行短的box，如果光标超过这个box，也是为选中
     * point2: 可能跨过两个段落
     */
    const anchorItem = anchorItems[0];
    const anchorNode = anchorItem.box.node!;
    const paragraphContainer = getParagraphContainer(anchorNode);

    const childNodes = Array.from(paragraphContainer.childNodes).filter(n => n?.IsElement());
    const items = childNodes.map(p => {
      const paragraph = this.canvas.view.layoutManager.getParagraphOfNode(p!.firstChild!)!;
      return this.canvas.view.layoutManager.getRTreeItemsByParagraph(paragraph);
    }).flat().sort((a, b) => a.minY < b.minY ? -1 : 1);

    let minItem: Optional<ITextBoxRTreeItem>;
    let maxItem: Optional<ITextBoxRTreeItem>;
    for (let item of items) {
      if (item.minY <= minY && item.maxY >= minY) {
        minItem = item;
      }
      if (item.minY <= maxY) {
        maxItem = item;
      }
    }

    if (!minItem) {
      // 说明 min point 在第一个 item 之前、max 落在第一个 item
      minItem = items[0];
    }

    DCHECK(minItem);
    DCHECK(maxItem);
    let minOffset: number;
    if (minY <= minItem.minY) {
      minOffset = minItem.box.GetTextStartPosition();
    } else {
      const boxLeft = minItem.minX;
      const boxRight = minItem.maxX;
      if (minX >= boxRight) {
        minOffset = minItem.box.GetTextEndPosition();
      } else if (minX <= boxLeft) {
        minOffset = minItem.box.GetTextStartPosition();
      } else {
        minOffset = minItem.box.GetTextPositionAtVisualLocation(minX - boxLeft);
      }
    }

    let maxOffset: number;
    if (maxY >= maxItem.maxY) {
      maxOffset = maxItem.box.GetTextEndPosition();
    } else {
      const boxRight = maxItem.maxX;
      const boxLeft = maxItem.minX;
      if (maxX >= boxRight) {
        maxOffset = maxItem.box.GetTextEndPosition();
      } else if (maxX < boxLeft) {
        maxOffset = maxItem.box.GetTextStartPosition();
      } else {
        maxOffset = maxItem.box.GetTextPositionAtVisualLocation(maxX - boxLeft);
      }
    }

    const range = this.canvas.view.document.createRange();
    if (firstAsMin) {
      range.setStart(minItem.box.node!, minOffset);
      range.setEnd(maxItem.box.node!, maxOffset);
    } else {
      range.setStart(maxItem.box.node!, maxOffset);
      range.setEnd(minItem.box.node!, minOffset);
    }

    selection.addRange(range);
    if (selection.anchorOffset < 0) NOTREACHED();
    if (selection.focusOffset < 0) NOTREACHED();
  }

  private _updateCollapsedSelect(x: number, y: number) {
    const anchorX = this.anchorX!;
    const anchorY = this.anchorY!;
    const selection = this.canvas.view.document.getSelection();
    const startItems = this.canvas.view.layoutManager.hitTestRTree(anchorX, anchorY, anchorX, anchorY);
    if (!startItems.length) {
      selection.removeAllRanges();
      return;
    }
    const startItem = startItems[0];
    const boxLeft = startItem.minX;
    const position = x - boxLeft;
    let offset: number;
    if (position <= 0) {
      NOTREACHED();
    } else if (position === 0) {
      offset = startItem.box.GetTextStartPosition();
    } else {
      offset = startItem.box.GetTextPositionAtVisualLocation(position);
    }
    const node = startItem.box.node!;
    const range = this.canvas.view.document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset);
    selection.addRange(range);
  }

  private _initEditor(anchor: Node) {
    DCHECK(anchor.IsText());
    const paragraphContainer = anchor.parentElement!.parentElement!;
    const id = paragraphContainer.getAttribute(AttrNameOfId);
    const scope = getScope(paragraphContainer);
    DCHECK(id);
    const vm = this.canvas.viewModel.getViewModelNodeById(ScopedIdentifier.create(id, scope));
    DCHECK(vm);
    const doc = this.canvas.view.document;
    // const dom = this.canvas.view.document.get
    const dom = Array.from(doc.body()!.childNodes).find(e => e && e.IsElement() && e.getAttribute(AttrNameOfId) === id);
    DCHECK(dom);
    this._editorView = new EditorView(
      dom.AsElement()!.AsHTMLElement()!,
      doc,
      {
        hasFocus: () => {
          return this._textAreaHandler!.isFocused();
        }
      },
      new CanvasUpdater(this.canvas),
      {
        state: EditorState.create({
          doc: EditorNode.fromJSON(defaultSchema, vm),
        }),
        plugins: [
          keymapPlugin(baseKeymap)
        ]
      });
    this._editorView.domObserver.flush();
    Reflect.set(window, 'vv', this._editorView);

    this._textAreaHandler = new TextAreaHandler(
      new ViewController(this._editorView, this._triggerEndEditing.bind(this)),
      this.canvas.view,
    );
    document.body.append(
      this._textAreaHandler.textArea.domNode,
      this._textAreaHandler.textAreaCover.domNode,
    );
    this._textAreaHandler.focusTextArea();
  }
}

export const TextToolID = 'tool.text';

class TextActivationShortcut extends ToolActivationShortcut {
  isDoubleClickShortcut() {
    return true;
  }
}

export class TextToolFactory implements IToolFactory {
  id = TextToolID;

  createTool(canvas: ICanvas): ITool {
    return new TextTool(canvas, CursorStyle.text);
  }
  shortcut = new TextActivationShortcut();
}
