import { Optional } from '../../../../base/common/typescript';
import { HTMLParagraphElement } from '../../../../engine/dom/html_paragraph_element';
import { DOMNode } from './view/dom';
import { Event } from '../../../../base/common/event';
import { Attrs, Node } from './model';

export interface ICanvasUpdater {
  onAfterMutation: Event<void>;
  updateText(node: DOMNode, value: Optional<string>): void;
  removeContent(node: HTMLParagraphElement[]): void;
  removeNodes(nodes: DOMNode[]): void;
  insertBefore(parent: DOMNode, newNode: Node, referenceNode?: Optional<DOMNode>): Attrs;
}
