import { DCHECK } from '../../../../base/check';
import { tail } from '../../../../base/common/array';
import { Emitter } from '../../../../base/common/event';
import { NOTREACHED } from '../../../../base/common/notreached';
import { Optional } from '../../../../base/common/typescript';
import { ICanvas } from '../../../../canvas/canvas/canvas';
import { collect } from '../../../../canvas/viewModel/path';
import { NodeType } from '../../../../common/node';
import { HTMLParagraphElement } from '../../../../engine/dom/html_paragraph_element';
import { Text } from '../../../../engine/dom/text';
import { DirectionType } from '../../../../platform/model/common/location';
import { ICanvasUpdater } from './canvasUpdater';
import { Attrs, Node } from './model';
import { DOMNode } from './view/dom';

export class CanvasUpdater implements ICanvasUpdater {
  private _onAfterMutation: Emitter<void> = new Emitter<void>();
  private _pendingUpdate = false;
  get onAfterMutation() {
    return this._onAfterMutation.event;
  }
  constructor(private canvas: ICanvas) {
  }

  private _queueUpdate() {
    if (this._pendingUpdate) {
      return;
    }
    this._pendingUpdate = true;
    queueMicrotask(() => {
      this._pendingUpdate = false;
      this._onAfterMutation.fire();
    });
  }

  updateText(domNode: Text, value: string) {
    DCHECK(domNode.IsText());
    const pElement = domNode.parentElement;
    DCHECK(pElement && pElement.tagName === HTMLParagraphElement.kTagName);
    const path = collect(pElement);
    const { id, scope } = tail(path);
    this.canvas.transform(() => {
      const m = this.canvas.getScopedModel(scope);
      const nodeModel = m.getNodeById(id);
      DCHECK(nodeModel);
      DCHECK(nodeModel.get('type') === NodeType.Text);
      nodeModel.set('content', value);
    });

    this._queueUpdate();
  }

  removeContent(node: HTMLParagraphElement[]) {
    if (!node.length) return;
    this.canvas.transform(() => {
      node.forEach(node => {
        if (node.nodeName !== HTMLParagraphElement.kTagName) NOTREACHED();
        const path = collect(node);
        const { id, scope } = tail(path);
        const m = this.canvas.getScopedModel(scope);
        const nodeModel = m.getNodeById(id);
        DCHECK(nodeModel);
        DCHECK(nodeModel.get('type') === NodeType.Text);
        nodeModel.set('content', '');
      });
    });
  }

  removeNodes(nodes: DOMNode[]): void {
    if (!nodes.length) return;
    this.canvas.transform(() => {
      nodes.forEach(node => {
        const el = node.AsElement()!.AsHTMLElement()!;
        DCHECK(el.tagName === HTMLParagraphElement.kTagName);
        const path = collect(el);
        const { id, scope } = tail(path);
        const m = this.canvas.getScopedModel(scope);
        m.removeNodes([id]);
      });
    });

    this._queueUpdate();
  }

  insertBefore(parent: DOMNode, newNode: Node, referenceNode: Optional<DOMNode>): Attrs {
    const pathOfParent = collect(parent.AsElement()!);
    const pathOfRef = referenceNode ? collect(referenceNode.AsElement()!) : undefined;
    DCHECK(newNode.inlineContent);
    const nodeInit = {
      type: NodeType.Text as const,
      style: {
        display: 'block',
        fontFamily: '"source han sans"',
        fontSize: '14px',
        color: 'black',
        lineHeight: '20px',
        minHeight: '20px',
        overflowWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      },
      content: newNode.textContent || '',
    };

    this._queueUpdate();

    return this.canvas.transform(() => {
      const parentMeta = tail(pathOfParent);
      const refMeta = pathOfRef ? tail(pathOfRef) : undefined;
      const m = this.canvas.getScopedModel(parentMeta.scope);
      const at = refMeta ? { ref: refMeta.id, direction: DirectionType.forward } : {
        ref: parentMeta.id,
        direction: DirectionType.inward
      };
      const node = m.addNode(at, nodeInit);
      return {
        id: node.get('id'),
        type: node.get('type'),
        scope: parentMeta.scope.key,
        parent: parentMeta.id,
      };
    });
  }
}
