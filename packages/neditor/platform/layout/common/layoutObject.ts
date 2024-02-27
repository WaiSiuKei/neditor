import { cloneDeep, isEqual } from 'lodash';
import { CHECK } from '../../../base/check';
import { NOTREACHED } from '../../../base/common/notreached';
import { ITypedNode } from '../../../common/node';

import type { ISyncOptions } from './common';
import { DefaultSyncOptions } from './common';
import { ILayoutObject, ILayoutService, LayoutData, LayoutDeclarations } from './layout';

export class LayoutObject implements ILayoutObject {
  static ID = 1;
  public readonly instanceId = LayoutObject.ID++;
  readonly children: LayoutObject[] = [];
  private isLayoutContainer = new Map<string, boolean>();
  private isLayoutItem = new Map<string, boolean>();
  private isLayoutDirty = new Map<string, boolean>();
  private isStructureDirty = new Map<string, boolean>();
  declarations: LayoutDeclarations = Object.create(null);
  private nodes = new Map<string, unknown>();
  parent: LayoutObject | null = null;
  constructor(
    public readonly model: ITypedNode,
    private readonly ctx: ILayoutService,
  ) {}

  get id() {
    return this.model.id;
  }

  addChild(c: LayoutObject) {
    this.children.push(c);
    c.parent = this;
  }

  clearChildren() {
    this.children.forEach((c) => c.dispose());
    this.children.length = 0;
  }

  syncDeclarations(opts: ISyncOptions = DefaultSyncOptions) {
    this.isLayoutDirty.clear();
    const keysToClear: Array<keyof LayoutDeclarations> = [];
    this.ctx.algorithms.forEach((algo) => {
      const isLayoutContainer = algo.isLayoutContainer(this.model);
      const isLayoutItem = algo.isLayoutItem(this.model);
      this.setIsLayoutContainer(algo.type, isLayoutContainer);
      this.setIsLayoutItem(algo.type, isLayoutItem);
      if (!isLayoutContainer && !isLayoutItem) {
        keysToClear.push(...algo.interestedKeys);
        return;
      }
      const isLayoutRoot = isLayoutContainer && !isLayoutItem;
      algo.interestedKeys.forEach((key) => {
        if ((key === 'top' || key === 'left') && isLayoutRoot) {
          /**
           * 布局根元素不需要关注 top left 变化
           */
          return;
        }
        const val = (this.model as LayoutDeclarations)[key];
        const prev = this.declarations[key];
        // 需要比较 array、object 里面的值
        if (!isEqual(prev, val)) {
          (this.declarations[key] as LayoutDeclarations[keyof LayoutDeclarations]) =
            cloneDeep(val);
          // prev 是 undefined 也要设置为 dirty
          // 比如新添加的元素
          this.invalidateLayout(algo.type);
        }
      });
      if (opts.forceRelayout) {
        this.invalidateLayout(algo.type);
      }
    });
    keysToClear.forEach((k) => {
      delete this.declarations[k];
    });
  }

  private setIsLayoutContainer(type: string,
                               val: boolean) {
    const prev = this.getIsLayoutContainer(type);
    if (Boolean(prev) !== val) {
      this.isLayoutContainer.set(type, val);
      if (prev !== undefined) {
        this.invalidateStructure(type);
      }
    }
  }

  getIsLayoutContainer(type: string) {
    return this.isLayoutContainer.get(type);
  }

  private setIsLayoutItem(type: string,
                          val: boolean) {
    const prev = this.getIsLayoutItem(type);
    if (Boolean(prev) !== val) {
      this.isLayoutItem.set(type, val);
      if (prev !== undefined) {
        this.invalidateStructure(type);
      }
    }
  }

  getIsLayoutItem(type: string) {
    return this.isLayoutItem.get(type);
  }

  getIsLayoutDirty(type: string): boolean {
    return !!this.isLayoutDirty.get(type);
  }

  getIsStructureDirty(type: string): boolean {
    return !!this.isStructureDirty.get(type);
  }

  resetStructureDirty(type: string) {
    this.isStructureDirty.delete(type);
  }

  resetLayoutDirty(type: string) {
    this.isLayoutDirty.delete(type);
  }

  private invalidateStructure(layoutAlgoType: string) {
    if (this.isStructureDirty.get(layoutAlgoType)) return;
    this.isStructureDirty.set(layoutAlgoType, true);
    this.invalidateLayout(layoutAlgoType);
    const { parent } = this;
    if (!parent) return;
    if (!parent.getIsLayoutContainer(layoutAlgoType)) return;
    parent.invalidateStructure(layoutAlgoType);
  }

  private invalidateLayout(layoutAlgoType: string) {
    if (this.isLayoutDirty.get(layoutAlgoType)) return;
    this.isLayoutDirty.set(layoutAlgoType, true);
    const { parent } = this;
    if (!parent) return;
    if (!parent.getIsLayoutContainer(layoutAlgoType)) return;
    parent.invalidateLayout(layoutAlgoType);
  }

  getNode<T>(type: string): T {
    return this.nodes.get(type) as T;
  }

  setNode<T>(type: string,
             val: T) {
    CHECK(!this.nodes.has(type));
    this.nodes.set(type, val);
  }

  hasNode(type: string): boolean {
    return this.nodes.has(type);
  }

  deleteNode(type: string) {
    return this.nodes.delete(type);
  }

  commitLayout(l: Partial<LayoutData>): void {
    this.ctx.commitLayout(this, l);
  }

  dispose() {
    this.ctx.algorithms.forEach((algo) => {
      algo.destroyStructures([this]);
    });
    this.clearChildren();
    this.isLayoutContainer.clear();
    this.isLayoutItem.clear();
    this.isLayoutDirty.clear();
    this.isStructureDirty.clear();
    this.parent = null;
  }

  dump() {
    dumpLayoutObject(this);
  }
}

export function dumpLayoutObject(node: LayoutObject,
              str = '',
              indentLevel = 0) {
  str += '\n';
  str += createIndent(indentLevel);
  str += dumpNode(node);
  const model = node.model;
  if (!model.isAncestor()) return str;
  const { children: childNodes } = model;
  const { children: childLayoutObjects } = node;
  if (childLayoutObjects.length !== childNodes.length) NOTREACHED();
  for (let i = 0, count = childNodes.length; i < count; i++) {
    const c = childLayoutObjects[i];
    if (c.model !== childNodes[i]) NOTREACHED();
    str = dumpLayoutObject(c, str, indentLevel + 1);
  }
  return str;
}

function createIndent(level: number) {
  return ''.padEnd(level, ' ');
}

function dumpNode(l: LayoutObject) {
  const n = l.model;
  return `${n.type}#${n.id} of ${l.id}`;
}
