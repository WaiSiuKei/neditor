import { Emitter, Event } from '@neditor/core/base/common/event';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { NOTIMPLEMENTED } from '../../base/common/notreached';
import { MicrotaskDelay } from '../../base/common/symbols';
import { Optional } from '../../base/common/typescript';
import type { Document } from '../dom/document';
import { Node } from '../dom/node';
import { Range } from '../dom/range';

export enum SelectionType {
  None = 'None',
  Caret = 'Caret',
  Range = 'Range'
}

export class Selection extends Disposable {
  private _onDidChange = this._register(new Emitter<void>());
  private _doc: Document;
  // private _debouncedOnDidChangeEvent: Event<void>;

  constructor(doc: Document) {
    super();
    this._doc = doc;
    // this._debouncedOnDidChangeEvent = Event.debounce(this._onDidChange.event,
    //   (last, event) => event,
    //   MicrotaskDelay,
    //   true,
    // );
  }

  get onDidChange() {
    return this._onDidChange.event;
  }
  // get onDidChangeNextTick() {
  //   return this._debouncedOnDidChangeEvent;
  // }
  ranges: Range[] = [];
  get anchorNode(): Node | null {
    if (!this.ranges.length) return null;
    const r = this.ranges[0];
    return r.startContainer;
  }
  get anchorOffset(): number {
    if (!this.ranges.length) return 0;
    const r = this.ranges[0];
    return r.startOffset;
  }
  get focusNode(): Node | null {
    if (!this.ranges.length) return null;
    const r = this.ranges[0];
    return r.endContainer;
  }
  get focusOffset(): number {
    if (!this.ranges.length) return 0;
    const r = this.ranges[0];
    return r.endOffset;
  }
  get type(): SelectionType {
    if (!this.ranges.length) return SelectionType.None;
    const r = this.ranges[0];
    return r.collapsed ? SelectionType.Caret : SelectionType.Range;
  }
  get isCollapsed(): boolean {
    if (!this.ranges.length) return false;
    const r = this.ranges[0];
    return r.collapsed;
  }
  get rangeCount(): number {
    return this.ranges.length;
  }
  addRange(range: Range) {
    this.ranges.length = 0;
    this.ranges.push(range);
    this._onDidChange.fire();
  }
  getRangeAt(number = 0): Range | null {
    if (!this.ranges.length) return null;
    return this.ranges[0];
  }
  removeAllRanges() {
    this.ranges.length = 0;
    this._onDidChange.fire();
  }
  extend(node: Node, offset = 0) {
    return NOTIMPLEMENTED();
  }
  // https://www.w3.org/TR/selection-api/#dom-selection-collapse
  collapse(node: Node, offset = 0) {
    // 1. If node is null, this method must behave identically as
    // removeAllRanges() and abort these steps.
    if (!node) {
      // UseCounter::Count(DomWindow(), WebFeature::kSelectionCollapseNull);
      this.removeAllRanges();
      return;
    }

    // 2. The method must throw an IndexSizeError exception if offset is longer
    // than node's length ([DOM4]) and abort these steps.
    Range.prototype.CheckNodeWOffset(node, offset);

    // 3. If node's root is not the document associated with the context object,
    // abort these steps.
    if (!this.IsValidForPosition(node))
      return;
    //
    // 4. Otherwise, let newRange be a new range.
    let new_range = Range.createFromDoc(this._doc);

    // // 5. Set ([DOM4]) the start and the end of newRange to (node, offset).
    new_range.setStart(node, offset);
    new_range.setEnd(node, offset);

    // 6. Set the context object's range to newRange.
    this.addRange(new_range);
  }

  IsValidForPosition(node: Optional<Node>): boolean {
    // DCHECK(DomWindow());
    if (!node)
      return true;
    return node.GetDocument() === this._doc && node.isConnected();
  }
}
