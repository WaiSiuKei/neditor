import { DCHECK } from '../../../../../base/check';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../../../base/common/notreached';
import { Optional } from '../../../../../base/common/typescript';
import { ICanvas } from '../../../../../canvas/canvas/canvas';
import { getScope } from '../../../../../canvas/canvasCommon/path';
import { HTMLSpanElement } from '../../../../../engine/dom/html_span_element';
import { BlockNodeModelProxy, DescendantModelProxy, TextNodeModelProxy } from '../../../../../platform/model/common/model';
import { Editor, Path, Point, Range, Descendant, Node, Text, createEditor } from '../editor';
import { DOMElement, DOMNode, DOMPoint, DOMRange, DOMSelection, isDOMElement, isDOMSelection, normalizeDOMPoint } from '../utils/dom';

export class EditorInterface {
  public state: Editor;
  constructor(
    private canvas: ICanvas,
    ...args: Parameters<typeof createEditor>
  ) {
    this.state = createEditor(...args);
  }

  get el() {
    return this.state.el;
  }

  get root() {
    return this.state.root;
  }

  get selection() {
    return this.state.selection;
  }

  toSlateRange<T extends boolean>(
    domRange: DOMRange | DOMSelection,
    options: {
      exactMatch: boolean
      suppressThrow: T
    }
  ): T extends true ? Range | null : Range {
    const { state } = this;
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
      : this.toSlatePoint([focusNode, focusOffset], {
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
      Editor.void(state, { at: range.focus, mode: 'highest' })
    ) {
      range = Editor.unhangRange(state, range, { voids: true });
    }

    return (range as unknown) as T extends true ? Range | null : Range;
  }

  toSlatePoint<T extends boolean>(
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
    const slateNode = this.toSlateNode(textNode);
    if (!slateNode) {
      if (suppressThrow) {
        return null as T extends true ? Point | null : Point;
      }
      throw new Error(
        `Cannot resolve a Slate point from DOM point: ${domPoint}`
      );
    }
    const path = this.findPath(slateNode);
    return { path, offset } as T extends true ? Point | null : Point;
  }

  toSlateNode(domNode: DOMNode): Optional<BlockNodeModelProxy | TextNodeModelProxy> {
    let domEl = isDOMElement(domNode) ? domNode : domNode.parentElement;

    DCHECK(domEl);
    const id = domEl.getAttribute('id');
    DCHECK(id);
    const scope = getScope(domEl);
    const node = this.canvas.getScopedModel(scope).getNodeById(id);
    if (node) {
      DCHECK(node && (node.isBlock() || node.isText()));
    }
    return node;
  }

  toNode(path: Path): Node {
    const toVisit = path.slice();
    let ret: Node = this.state.root;
    toVisit.forEach(idx => {
      DCHECK(!Text.isText(ret));
      const children = ret.children;
      ret = children[idx];
      DCHECK(ret);
    });
    DCHECK(ret);
    return ret;
  }

  findPath(node: Descendant): Path {
    const { state } = this;

    const path: Path = [];
    let child = node as DescendantModelProxy;

    const model = this.canvas.model;

    while (true) {
      if (child.id === (state.root as BlockNodeModelProxy).id) return path;
      const parent = model.getParentNodeOfId(child.id);

      DCHECK(parent && parent.isBlock());

      const children = model.getChildrenNodesOfId(parent.id);
      const i = children.findIndex(c => c.id === child.id);

      DCHECK(i > -1);

      path.unshift(i);
      child = parent;
    }

    NOTREACHED();
  }
}
