import { HTMLElement } from '../../../../../engine/dom/html_element';
import type { Element } from './';
import {
  addMark,
  deleteFragment,
  Editor,
  getDirtyPaths,
  getFragment,
  insertBreak,
  insertFragment,
  insertNode,
  insertSoftBreak,
  insertText,
  normalizeNode,
  removeMark,
  shouldNormalize,
} from './';
import { apply } from './core';
import {
  above,
  after,
  before,
  deleteBackward,
  deleteForward,
  edges,
  elementReadOnly,
  end,
  first,
  fragment,
  getVoid,
  hasBlocks,
  hasInlines,
  hasPath,
  hasTexts,
  isBlock,
  isEdge,
  isEmpty,
  isEnd,
  isNormalizing,
  isStart,
  last,
  leaf,
  levels,
  marks,
  next,
  node,
  nodes,
  normalize,
  parent,
  path,
  pathRef,
  pathRefs,
  point,
  pointRef,
  pointRefs,
  positions,
  previous,
  range,
  rangeRef,
  rangeRefs,
  setNormalizing,
  start,
  string,
  unhangRange,
  withoutNormalizing,
} from './editor';
import { deleteText } from './transforms-text';
import {
  collapse,
  deselect,
  move,
  select,
  setPoint,
  setSelection,
} from './transforms-selection';
import {
  insertNodes,
  liftNodes,
  mergeNodes,
  moveNodes,
  removeNodes,
  setNodes,
  splitNodes,
  unsetNodes,
  unwrapNodes,
  wrapNodes,
} from './transforms-node';

/**
 * Create a new Slate `Editor` object.
 */
export const createEditor = (opt: {
  root: Element,
  el: HTMLElement,
}): Editor => {
  const {
    root,
    el,
  } = opt;
  const editor: Editor = {
    _newOnlyBrand: undefined,
    el,
    root,
    get children() {
      return root.children;
    },
    operations: [],
    selection: null,
    marks: null,
    isElementReadOnly: () => false,
    isInline: () => false,
    isSelectable: () => true,
    isVoid: () => false,
    markableVoid: () => false,
    onChange: () => {},

    // type
    isEditor: () => { return true;},
    // 自定义接口
    get removeChildAt() {
      return Reflect.get(this.root, 'removeChildAt').bind(this.root);
    },
    get insertChildAt() {
      return Reflect.get(this.root, 'insertChildAt').bind(this.root);
    },
    get appendChildren() {
      return Reflect.get(this.root, 'appendChildren').bind(this.root);
    },
    get setChildren() {
      return Reflect.get(this.root, 'setChildren').bind(this.root);
    },
    get insertAfter() {
      return Reflect.get(this.root, 'insertAfter').bind(this.root);
    },

    // Core
    apply: (...args) => apply(editor, ...args),

    // Editor
    addMark: (...args) => addMark(editor, ...args),
    deleteBackward: (...args) => deleteBackward(editor, ...args),
    deleteForward: (...args) => deleteForward(editor, ...args),
    deleteFragment: (...args) => deleteFragment(editor, ...args),
    getFragment: (...args) => getFragment(editor, ...args),
    insertBreak: (...args) => insertBreak(editor, ...args),
    insertSoftBreak: (...args) => insertSoftBreak(editor, ...args),
    insertFragment: (...args) => insertFragment(editor, ...args),
    insertNode: (...args) => insertNode(editor, ...args),
    insertText: (...args) => insertText(editor, ...args),
    normalizeNode: (...args) => normalizeNode(editor, ...args),
    removeMark: (...args) => removeMark(editor, ...args),
    getDirtyPaths: (...args) => getDirtyPaths(editor, ...args),
    shouldNormalize: (...args) => shouldNormalize(editor, ...args),

    // Editor interface
    above: (...args) => above(editor, ...args),
    after: (...args) => after(editor, ...args),
    before: (...args) => before(editor, ...args),
    collapse: (...args) => collapse(editor, ...args),
    delete: (...args) => deleteText(editor, ...args),
    deselect: (...args) => deselect(editor, ...args),
    edges: (...args) => edges(editor, ...args),
    elementReadOnly: (...args) => elementReadOnly(editor, ...args),
    end: (...args) => end(editor, ...args),
    first: (...args) => first(editor, ...args),
    fragment: (...args) => fragment(editor, ...args),
    getMarks: (...args) => marks(editor, ...args),
    hasBlocks: (...args) => hasBlocks(editor, ...args),
    hasInlines: (...args) => hasInlines(editor, ...args),
    hasPath: (...args) => hasPath(editor, ...args),
    hasTexts: (...args) => hasTexts(editor, ...args),
    insertNodes: (...args) => insertNodes(editor, ...args),
    isBlock: (...args) => isBlock(editor, ...args),
    isEdge: (...args) => isEdge(editor, ...args),
    isEmpty: (...args) => isEmpty(editor, ...args),
    isEnd: (...args) => isEnd(editor, ...args),
    isNormalizing: (...args) => isNormalizing(editor, ...args),
    isStart: (...args) => isStart(editor, ...args),
    last: (...args) => last(editor, ...args),
    leaf: (...args) => leaf(editor, ...args),
    levels: (...args) => levels(editor, ...args),
    liftNodes: (...args) => liftNodes(editor, ...args),
    mergeNodes: (...args) => mergeNodes(editor, ...args),
    move: (...args) => move(editor, ...args),
    moveNodes: (...args) => moveNodes(editor, ...args),
    next: (...args) => next(editor, ...args),
    node: (...args) => node(editor, ...args),
    nodes: (...args) => nodes(editor, ...args),
    normalize: (...args) => normalize(editor, ...args),
    parent: (...args) => parent(editor, ...args),
    path: (...args) => path(editor, ...args),
    pathRef: (...args) => pathRef(editor, ...args),
    pathRefs: (...args) => pathRefs(editor, ...args),
    point: (...args) => point(editor, ...args),
    pointRef: (...args) => pointRef(editor, ...args),
    pointRefs: (...args) => pointRefs(editor, ...args),
    positions: (...args) => positions(editor, ...args),
    previous: (...args) => previous(editor, ...args),
    range: (...args) => range(editor, ...args),
    rangeRef: (...args) => rangeRef(editor, ...args),
    rangeRefs: (...args) => rangeRefs(editor, ...args),
    removeNodes: (...args) => removeNodes(editor, ...args),
    select: (...args) => select(editor, ...args),
    setNodes: (...args) => setNodes(editor, ...args),
    setNormalizing: (...args) => setNormalizing(editor, ...args),
    setPoint: (...args) => setPoint(editor, ...args),
    setSelection: (...args) => setSelection(editor, ...args),
    splitNodes: (...args) => splitNodes(editor, ...args),
    start: (...args) => start(editor, ...args),
    string: (...args) => string(editor, ...args),
    unhangRange: (...args) => unhangRange(editor, ...args),
    unsetNodes: (...args) => unsetNodes(editor, ...args),
    unwrapNodes: (...args) => unwrapNodes(editor, ...args),
    void: (...args) => getVoid(editor, ...args),
    withoutNormalizing: (...args) => withoutNormalizing(editor, ...args),
    wrapNodes: (...args) => wrapNodes(editor, ...args),
  };

  return editor;
};
