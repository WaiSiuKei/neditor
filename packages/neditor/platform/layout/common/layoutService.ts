import { isEqual } from 'lodash';
import { DeferredPromise } from '../../../base/common/async';
import { Nullable } from '../../../base/common/typescript';
import { TRACE_EVENT } from '../../../base/trace_event/common/trace_event_common';
import { ICanvas } from '../../../canvas/canvas/canvas';
import { IRootNode, ITypedNode } from '../../../common/node';
import { IDocumentModel, IModelService } from '../../model/common/model';
import { DefaultSyncOptions, ISyncOptions } from './common';
import { dumpLayoutObject, LayoutObject } from './layoutObject';
import { ILayoutAlgorithm, ILayoutObject, ILayoutService, LayoutData } from './layout';

const trace = (...args: any) => {
  TRACE_EVENT('LAYOUT', ...args);
};

export class LayoutService implements ILayoutService {
  public _serviceBrand: undefined;

  currentTreeSource: Nullable<IRootNode> = null;
  public layoutRoot: Nullable<LayoutObject> = null;
  layoutObjects = new Map<string, LayoutObject>();
  dirtyRoots = new Set<string>();
  /**
   * 具体的布局算法
   */
  readonly algorithms: ILayoutAlgorithm[] = [];
  /**
   * 管理嵌套调用，pushCallStack 入栈，popCallStack 出栈
   */
  private _callStackDepth = 0;
  public get callStackDepth() {
    return this._callStackDepth;
  }

  private set callStackDepth(val: number) {
    this._callStackDepth = val;
  }

  /**
   * 结构是否已经同步
   */
  private _ready = false;
  public get ready() {
    return this._ready;
  }

  private set ready(val: boolean) {
    this._ready = val;
  }

  private loadAlgorithmsPromise = new DeferredPromise<boolean>();
  /**
   * 是否正在进行布局计算
   */
  private _updating = false;
  public get updating() {
    return this._updating;
  }

  private set updating(val: boolean) {
    this._updating = val;
  }

  constructor(
    private canvas: ICanvas,
    @IModelService private modelService: IModelService,
  ) {
    /* istanbul ignore next -- @preserve */
    if (process.env.NODE_ENV === 'development') {
      Reflect.set(window, 'layoutEngine', this);
    }
  }

  get doc() {
    return this.canvas.model;
  }

  syncDoc(root: IRootNode,
          options: ISyncOptions = DefaultSyncOptions) {
    if (root !== this.currentTreeSource) {
      this.layoutObjects.clear();
      this.layoutRoot?.dispose();

      this.currentTreeSource = root;
      options.isInitializing = true;
    }

    if (!this.layoutRoot) {
      const l = new LayoutObject(root, this);
      this.layoutRoot = l;
      this.layoutObjects.set(l.id, l);
    }

    this.syncTree(root, options);
  }

  syncTree(node: IRootNode,
           opts: ISyncOptions) {
    const elToTraverse: ITypedNode[] = [node];
    while (elToTraverse.length > 0) {
      const e = elToTraverse.shift()!;
      let l = this.layoutObjects.get(e.id);
      if (!l) {
        l = new LayoutObject(e, this);
        this.layoutObjects.set(l.id, l);
        if (!e.parent) debugger;
        const parentLayoutObject = this.layoutObjects.get(e.parent!.id)!;
        parentLayoutObject.addChild(l);
        l.syncDeclarations(opts);
      } else {
        l.syncDeclarations(opts);
      }

      if (e.isAncestor()) {
        // TODO: 使用 tree diff 算法进行优化
        const layoutObjectUUIDs = l.children.map((c) => c.id);
        const modelUUIDs = e.children.map((m) => m.id);
        if (!isEqual(layoutObjectUUIDs, modelUUIDs)) {
          l.clearChildren();
        }
        elToTraverse.push(...e.children);
      }
    }
    // 如果只是初始化的话，只创建布局树，不做其他处理
    // 否则同步计算节点 & 重新布局
    if (opts.isInitializing && !opts.forceRelayout) return;
    this.doRelayout(node);
  }

  doRelayout(root: ITypedNode) {
    const doRelayout = () => {
      this.algorithms.forEach((algo) => {
        const dirtyStructureRoots: LayoutObject[] = [];
        const dirtyLayoutRoots: LayoutObject[] = [];
        // 之前参与某种布局但后面脱离这种布局的
        const detached: LayoutObject[] = [];
        const rootLayoutObject = this.layoutObjects.get(root.id)!;
        const toTraverse: LayoutObject[] = [rootLayoutObject];
        while (toTraverse.length > 0) {
          const l = toTraverse.shift()!;
          if (l.getIsLayoutContainer(algo.type) && !l.getIsLayoutItem(algo.type)) {
            if (l.getIsStructureDirty(algo.type)) {
              dirtyStructureRoots.push(l);
            }
            if (l.getIsLayoutDirty(algo.type)) {
              dirtyLayoutRoots.push(l);
            }
          }
          if (
            l.getIsStructureDirty(algo.type) &&
            !l.getIsLayoutContainer(algo.type) &&
            !l.getIsLayoutItem(algo.type)
          ) {
            detached.push(l);
          }
          if (l.children.length > 0) {
            toTraverse.push(...l.children);
          }
        }

        if (dirtyStructureRoots.length > 0 || dirtyLayoutRoots.length > 0) {
          TRACE_EVENT(
            'reLayout',
            `dirtyStructure: ${dirtyStructureRoots.length} dirtyLayout: ${dirtyLayoutRoots.length}`,
          );
          const buildAndLayout = () => {
            algo.destroyStructures(detached);
            // layout dirty >= structure dirty
            algo.rebuildStructures(dirtyLayoutRoots);
            algo.layout(dirtyLayoutRoots);
            this.dirtyRoots.delete(root.id);
          };
          if (!algo.loaded) {
            // 按理各种算法应该加载了
            console.warn('[EDITOR:LAYOUT]Layout algo not ready:', algo.type);
          } else {
            buildAndLayout();
          }
        }
      });
    };
    this.updating = true;
    try {
      if (this.ready) {
        doRelayout();
      } else {
        console.warn('[EDITOR:LAYOUT]LayoutEngine not ready');
      }
    } finally {
      // 按理只会有一个 tree 执行更新
      this.updating = false;
    }
  }

  pushCallStack() {
    /**
     * 更新布局计算时可能会调用到 makeSnapshotTransact
     * 这种受控的变动可以忽略
     */
    if (this.updating) return false;
    this.callStackDepth += 1;
    return true;
  }

  popCallStack() {
    if (this.updating) return false;
    if (this.callStackDepth !== 0) {
      this.callStackDepth -= 1;
      this.scheduleReLayout();
    }
    return true;
  }

  resetCallStack() {
    this.callStackDepth = 0;
  }

  scheduleReLayout(dirtyRoots: string[] = []) {
    dirtyRoots.forEach((layoutUUID) => this.dirtyRoots.add(layoutUUID));
    if (this.callStackDepth === 0) {
      this.syncDoc(this.doc.root, { isInitializing: false });
    }
  }

  forceReLayout() {
    trace('forceReLayout');
    let all = true;
    this.syncDoc(this.doc.root, { forceRelayout: true });
  }

  bind(doc?: IDocumentModel) {
    this.syncDoc(doc?.root || this.doc.root, { isInitializing: true });
  }

  commitLayout(l: ILayoutObject,
               data: Partial<LayoutData>) {
    this.modelService.transform(() => {
      Object.assign(l.model, data);
    });
  }

  async loadAlgorithms() {
    if (this.loadAlgorithmsPromise.isResolved) return;
    await Promise.all(this.algorithms.map((algo) => algo.load()));
    this.loadAlgorithmsPromise.complete(true);
    // TODO@YUDAN: 看是否有脏数据需要重新布局
    this.ready = true;
  }

  /* istanbul ignore next -- @preserve */
  dump() {
    if (!this.layoutRoot) return;
    dumpLayoutObject(this.layoutRoot);
    this.algorithms.forEach((algo) => {
      const roots: LayoutObject[] = [];
      const rootLayoutObject = this.layoutObjects.get(this.layoutRoot!.model.id)!;
      const toTraverse: LayoutObject[] = [rootLayoutObject];
      while (toTraverse.length > 0) {
        const l = toTraverse.shift()!;
        if (l.getIsLayoutContainer(algo.type) && !l.getIsLayoutItem(algo.type)) {
          roots.push(l);
        }
        if (l.children.length > 0) {
          toTraverse.push(...l.children);
        }
      }

      roots.forEach((root) => algo.dumpCalculationTree(root));
    });
  }

  dispose() {
    this.algorithms.forEach((algo) => {
      if (!this.layoutRoot) return;
      algo.destroyStructures([this.layoutRoot]);
    });
  }
}
