import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { CursorStyle } from '@neditor/core/canvas/view/view';
import { IMouseInputEvent, InputEvents, InputEventType } from '@neditor/core/platform/input/browser/event';
import { BaseTool } from '@neditor/core/platform/tool/browser/baseTool';
import { ITool, IToolFactory, IToolService, ToolActivationShortcut } from '@neditor/core/platform/tool/common/tool';
import randomColor from 'randomcolor';
import { toPX } from '../../../../base/browser/css';
import { DCHECK } from '../../../../base/check';
import { tail } from '../../../../base/common/array';
import { NOTREACHED } from '../../../../base/common/notreached';
import { deepClone } from '../../../../base/common/objects';
import { assertValue } from '../../../../base/common/type';
import { Optional } from '../../../../base/common/typescript';
import { AttrNameOfId, getScope } from '../../../../canvas/viewModel/path';
import { IIdentifier } from '../../../../common/common';
import { NodeType } from '../../../../common/node';
import { IInlineStyleDeclaration } from '../../../../common/style';
import { HTMLParagraphElement } from '../../../../engine/dom/html_paragraph_element';
import { Node } from '../../../../engine/dom/node';
import { NodeTraversal } from '../../../../engine/dom/node_traversal';
import { ITextBoxRTreeItem } from '../../../../engine/layout/r_tree';
import { HitTestLevel } from '../../../../platform/input/common/input';
import { DirectionType } from '../../../../platform/model/common/location';
import { INodeInit, isTextNodeModelProxy, RootNodeId } from '../../../../platform/model/common/model';
import { EditorView } from './view/editorView';

function isInlineText(n: Node) {
  if (n.IsText()) return true;
  return false;
}

function isParagraph(n: Node) {
  return n.IsElement() && n.firstChild && n.firstChild.firstChild && isInlineText(n.firstChild.firstChild);
}

function isParagraphContainer(n: Node) {
  return n.IsElement() && n.firstChild && isParagraph(n.firstChild);
}

function getParagraphContainer(n: Node): Node {
  DCHECK(n.IsText());
  return n.parentNode!.parentNode!.parentNode!;
}

export class TextTool extends BaseTool {
  anchorY: Optional<number>;
  anchorX: Optional<number>;
  _editorView: Optional<EditorView>;

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
    this._handleClick(e, { startOnEmpty: true });
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
    this._handleClick(e, { exitOnEmpty: true });
  }
  handleDrag(e: IMouseInputEvent) {
    this._updateSelection(e);
  }
  handleDrop(e: IMouseInputEvent) {
  }

  private _handleClick(e: IMouseInputEvent, opts: { exitOnEmpty?: boolean, startOnEmpty?: boolean }): void {
    this.anchorX = e.clientX;
    this.anchorY = e.clientY;
    let prevAnchor = this.canvas.view.document.getSelection().anchorNode;
    this._updateSelection(e);
    let curAnchor = this.canvas.view.document.getSelection().anchorNode;

    if (!prevAnchor && !curAnchor) {
      if (opts.startOnEmpty) {
        this._addTextBlock(e);
      }
      return;
    }

    if (prevAnchor && !curAnchor) {
      this._disposeEditor();
      if (opts.exitOnEmpty) {
        this.canvas.invokeWithinContext(accessor => {
          const toolService = accessor.get<IToolService>(IToolService);
          toolService.switchDefault();
        });
      }
      return;
    }

    if (!prevAnchor && curAnchor) {
      this._initEditor(curAnchor);
      return;
    }

    if (prevAnchor && curAnchor) {
      if (prevAnchor === curAnchor) {
        return;
      }
      const ancestor = NodeTraversal.CommonAncestor(prevAnchor, curAnchor);
      DCHECK(ancestor);
      if (ancestor === prevAnchor) {
        return;
      }
      if (isParagraphContainer(ancestor)) {
        return;
      }
      this._disposeEditor();
      this._initEditor(curAnchor);
      return;
    }

    NOTREACHED();
  }

  private _disposeEditor() {
    if (this._paragraphId) {
      const model = this.canvas.model.getNodeById(this._paragraphId);
      DCHECK(model);
      DCHECK(isTextNodeModelProxy(model));
      const content = model.content;
      if (!content) {
        this.canvas.transform(m => {
          m.removeNode({ ref: this._paragraphContainerId!, direction: DirectionType.self });
        });
      }
    }
    this._paragraphId = undefined;
    this._paragraphContainerId = undefined;
    if (this._editorView) {
      this._editorView.dispose();
      this._editorView = undefined;
    }
  }

  private _triggerEndEditing() {
    this._disposeEditor();
  }

  private _updateSelection(e: IMouseInputEvent) {
    const anchorX = this.anchorX!;
    const anchorY = this.anchorY!;
    const { clientX, clientY } = e;
    if (anchorX === clientX && anchorY === clientY) {
      return this._updateCollapsedSelection(e);
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
      const paragraph = this.canvas.view.layoutManager.getParagraphOfNode(p!.firstChild!.firstChild!)!;
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
      minOffset = minItem.box.GetVisualTextStartPosition();
    } else {
      const boxLeft = minItem.minX;
      const boxRight = minItem.maxX;
      if (minX >= boxRight) {
        minOffset = minItem.box.GetVisualTextEndPosition();
      } else if (minX <= boxLeft) {
        minOffset = minItem.box.GetVisualTextStartPosition();
      } else {
        minOffset = minItem.box.GetTextPositionAtVisualLocation(minX - boxLeft);
      }
    }

    let maxOffset: number;
    if (maxY >= maxItem.maxY) {
      maxOffset = maxItem.box.GetVisualTextEndPosition();
    } else {
      const boxRight = maxItem.maxX;
      const boxLeft = maxItem.minX;
      if (maxX >= boxRight) {
        maxOffset = maxItem.box.GetVisualTextEndPosition();
      } else if (maxX < boxLeft) {
        maxOffset = maxItem.box.GetVisualTextStartPosition();
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

  private _updateCollapsedSelection(e: IMouseInputEvent) {
    const { clientX, clientY } = e;
    const { targetPath } = e;
    const lastOne = tail(targetPath);
    const targetNode = lastOne.node;
    let startX = clientX;
    let endX = clientX;
    if (targetNode.IsElement()) {
      const targetEl = targetNode.AsElement();
      if (targetEl.tagName === HTMLParagraphElement.kTagName) {
        const rect = targetEl.getBoundingClientRect();
        startX = Math.min(rect.left, clientX);
        endX = Math.max(rect.right, clientX);
      }
    }
    const selection = this.canvas.view.document.getSelection();
    const startItems = this.canvas.view.layoutManager.hitTestRTree(startX, clientY, endX, clientY);
    if (!startItems.length) {
      selection.removeAllRanges();
      return;
    }
    const startItem = startItems[0];
    const boxLeft = startItem.minX;
    const boxRight = startItem.maxX;
    const spaceFromLeft = clientX - boxLeft;
    let offset: number;
    if (spaceFromLeft <= 0) {
      offset = startItem.box.GetVisualTextStartPosition();
    } else if (clientX >= boxRight) {
      offset = startItem.box.GetVisualTextEndPosition();
    } else {
      offset = startItem.box.GetTextPositionAtVisualLocation(spaceFromLeft);
    }
    const node = startItem.box.node!;
    const range = this.canvas.view.document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset);
    selection.addRange(range);
  }

  private _initEditor(anchor: Node) {
    DCHECK(anchor.IsText());
    this.canvas.setSelectedElements([]);
    // text -> span -> p -> div
    const paragraphContainer = anchor.parentElement!.parentElement!.parentElement!;
    const id = paragraphContainer.getAttribute(AttrNameOfId);
    const scope = getScope(paragraphContainer);
    DCHECK(id);
    const scopeModel = this.canvas.getScopedModel(scope);
    const node = scopeModel.getNodeById(id);
    DCHECK(node);
    DCHECK(node.isBlock());
    const doc = this.canvas.view.document;
    const dom = doc.getElementById(id);
    DCHECK(dom);
    DCHECK(!this._editorView);
    this._editorView = new EditorView(
      node,
      dom,
      this.canvas,
      this._triggerEndEditing.bind(this),
    );
  }

  _paragraphContainerId: Optional<IIdentifier>;
  _paragraphId: Optional<IIdentifier>;
  private async _addTextBlock(e: IMouseInputEvent) {
    const { clientX, clientY } = e;
    let paragraphContainerId = '';
    let paragraphId = '';
    this.canvas.transform(() => {
      let divToCreate = deepClone(emptyDivInit);
      Object.assign(divToCreate.style, {
        borderColor: randomColor(),
        marginTop: toPX(clientY
          - 10 // padding
          - 10 // half lineHeight
        ),
        marginLeft: toPX(clientX - 10)
      } as IInlineStyleDeclaration);
      const divNode = this.canvas.model.addNode({ ref: RootNodeId, direction: DirectionType.inward }, divToCreate);
      this._paragraphContainerId = divNode.id;
      paragraphContainerId = this._paragraphContainerId;
      const pNode = this.canvas.model.addNode({ ref: this._paragraphContainerId, direction: DirectionType.inward }, deepClone(emptyTextInit));
      paragraphId = pNode.id;
      this._paragraphId = paragraphId;
    });
    await this.canvas.mvvm.maybeWaitForReLayout();
    DCHECK(this._paragraphContainerId === paragraphContainerId);
    const { document } = this.canvas.view;
    const p = document.getElementById(paragraphId);
    const selection = document.getSelection();
    DCHECK(p);
    const text = p.firstChild;
    DCHECK(text);
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 0);
    selection.addRange(range);
    this._initEditor(text);
  }
}

const emptyDivInit: INodeInit = {
  type: NodeType.Block,
  style: {
    display: 'block',
    width: 'auto',
    height: 'auto',
    marginLeft: '50px',
    marginTop: '100px',
    position: 'absolute',
    backgroundColor: 'white',
    padding: '10px',
    borderStyle: 'solid',
    borderWidth: '1px',
    lineHeight: '20px',
    overflowWrap: 'break-word',
    whiteSpace: 'nowrap'
  },
};

const emptyTextInit: INodeInit = {
  type: NodeType.Text,
  style: {
    display: 'block',
    fontFamily: '"source han sans"',
    fontSize: '14px',
    color: 'black',
  },
  content: '',
};

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
