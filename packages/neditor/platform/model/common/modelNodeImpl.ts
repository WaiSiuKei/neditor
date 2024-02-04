// export const proxyHandler: ProxyHandler<ReturnType<typeof getNodeStyle>> = {
//   get(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration | 'toJSON'): any {
//     if (!isString(p)) NOTIMPLEMENTED();
//     if (p === 'toJSON') {
//       return () => {
//         return target.toJSON();
//       };
//     }
//     return target.get(p);
//   },
//   set(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration, value: ValueOf<Required<IStyleDeclaration>>): boolean {
//     if (!isString(p)) NOTIMPLEMENTED();
//     target.set(p, value);
//     return true;
//   },
//   has(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration): boolean {
//     if (!isString(p)) NOTIMPLEMENTED();
//     return target.has(p);
//   },
//   deleteProperty(target: ReturnType<typeof getNodeStyle>, p: keyof IStyleDeclaration): boolean {
//     if (!isString(p)) NOTIMPLEMENTED();
//     target.delete(p);
//     return true;
//   },
//   ownKeys(target: ReturnType<typeof getNodeStyle>): ArrayLike<keyof IStyleDeclaration> {
//     return Array.from(target.keys()) as unknown as ArrayLike<keyof IStyleDeclaration>;
//   }
// };

import { DCHECK } from '../../../base/check';
import { tail } from '../../../base/common/array';
import { devideBy2, plus } from '../../../base/common/bignumber';
import { EnumAndLiteral } from '../../../base/common/typescript';
import { IAncestorNode, IBlockNode, IDescendantNode, IRootNode, ITextNode } from '../../../common/node';
import { IDocumentRecord, ITextRecord } from '../../../common/record';
import { IIdentifier } from '../../../common/record/common';
import { RecordType } from '../../../common/record/types/base';
import { IBlockRecord } from '../../../common/record';
import { IRootRecord } from '../../../common/record';
import { IDocumentModel } from './model';

abstract class BaseNode<T extends IDocumentRecord = IDocumentRecord> {
  readonly id: IIdentifier;
  abstract get type(): EnumAndLiteral<RecordType>;
  parent: IAncestorNode | undefined;
  constructor(
    public data: T,
    protected model: IDocumentModel,
  ) {
    this.id = data.id;
  }

  get width() {
    return this.data.width;
  }

  get height() {
    return this.data.height;
  }

  get top() {
    return this.data.top;
  }

  get left() {
    return this.data.left;
  }

  get from(): IIdentifier {
    return this.data.from;
  }
  private set from(val: IIdentifier) {this.data.from = val;}

  get order(): string {
    return this.data.order;
  }
  protected set order(val: string) {this.data.order = val;}

  isRoot(): this is RootNode {
    return false;
  }
  isBlock(): this is BlockNode {
    return false;
  }
  isText(): this is TextNode {
    return false;
  }
  isAncestor(): this is IAncestorNode {
    return false;
  }
  isDescendant(): this is IDescendantNode {
    return true;
  }
  remove() {
    if (this.isAncestor()) {
      while (this.children.length) {
        const child = this.children.pop()!;
        child.remove();
      }
    }
    this.detach();
  }
  insertBefore(ref: IDescendantNode) {
    const parent = ref.parent;
    if (!parent) return;
    const children = parent.children;
    const idx = children.indexOf(ref);
    const prev = children[idx - 1];
    if (prev) {
      this.order = devideBy2(plus(ref.order, prev.order));
    } else {
      this.order = devideBy2(ref.order);
    }
    DCHECK(this.isDescendant());
    if (this.parent !== parent) this.parent = parent;
    this.attach();
  }
  insertAfter(ref: IDescendantNode) {
    const parent = ref.parent;
    if (!parent) return;
    const children = parent.children;
    const idx = children.indexOf(ref);
    const next = children[idx + 1];
    const nextOrder = next ? next.order : '1';
    this.order = devideBy2(plus(ref.order, nextOrder));
    DCHECK(this.isDescendant());
    if (this.parent !== parent) this.parent = parent;
    this.attach();
  }
  attach() {
    const model = this.model;
    DCHECK(this.isDescendant());
    model.addNode(this);
  }
  detach() {
    const model = this.model;
    DCHECK(this.isDescendant());
    model.removeNode(this);
  }
}

abstract class ParentNode<T extends IDocumentRecord> extends BaseNode<T> {
  readonly children: IDescendantNode[] = [];
  removeChildAt(idx: number): void {
    const children = this.children;
    const toDelete = children[idx];
    toDelete?.remove();
  }
  insertChildBefore(toAdd: IDescendantNode,
                    ref?: IDescendantNode): void {
    if (ref) {
      toAdd.insertBefore(ref);
    } else {
      const first = this.children[0];
      toAdd.order = first ? devideBy2(first.order) : '0.5';
      if (toAdd.parent !== this) {
        DCHECK(this.isAncestor());
        toAdd.parent = this;
      }
      toAdd.attach();
    }
  }
  insertChildAfter(toAdd: IDescendantNode,
                   ref?: IDescendantNode): void {
    if (ref) {
      toAdd.insertAfter(ref);
    } else {
      const lastOne = tail(this.children);
      toAdd.order = lastOne ? devideBy2(lastOne.order) : '0.5';
      if (toAdd.parent !== this) {
        DCHECK(this.isAncestor());
        toAdd.parent = this;
      }
      toAdd.attach();
    }
  }
  appendChildren(...toAdd: IDescendantNode[]): void {
    let left = tail(this.children)?.order || '0';
    toAdd.forEach((child) => {
      DCHECK(this.isAncestor());
      child.parent = this;
      left = devideBy2(plus(left, '1'));
      child.order = left;
      child.attach();
    });
  }
  setChildren(...children: IDescendantNode[]): void {
    while (this.children.length) {
      const c = this.children.pop()!;
      c.remove();
    }
    this.appendChildren(...children);
  }
  isAncestor(): this is IAncestorNode {
    return true;
  }
}

export class RootNode extends ParentNode<IRootRecord> implements IRootNode {
  type: EnumAndLiteral<RecordType.Root> = RecordType.Root;
  constructor(
    data: IRootRecord,
    model: IDocumentModel,
  ) {
    super(data, model);
    const type = data.type;
    DCHECK(type === RecordType.Root);
  }

  isDescendant(): this is IDescendantNode {
    return false;
  }
}

export class BlockNode extends ParentNode<IBlockRecord> implements IBlockNode {
  type: EnumAndLiteral<RecordType.Block> = RecordType.Block;
  constructor(
    data: IBlockRecord,
    model: IDocumentModel,
  ) {
    super(data, model);
    const type = data.type;
    DCHECK(type === RecordType.Block);
  }
  isBlock(): this is BlockNode {
    return true;
  }
  get display() {
    return this.data.display;
  }
}

export function isBlockNode(n: { type: EnumAndLiteral<RecordType> }): n is BlockNode {
  return n.type === RecordType.Block;
}

export class TextNode extends BaseNode<ITextRecord> implements ITextNode {
  type: EnumAndLiteral<RecordType.Text> = RecordType.Text;
  constructor(
    data: ITextRecord,
    model: IDocumentModel,
  ) {
    super(data, model);
    const type = data.type;
    DCHECK(type === RecordType.Text);
  }

  get content(): string {
    return this.data.content;
  }
  set content(val) {
    this.data.content = val;
  }
  isText(): this is TextNode {
    return true;
  }
}
