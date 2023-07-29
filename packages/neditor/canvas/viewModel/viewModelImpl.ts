import { begin, end, reactive } from '../../base/common/reactivity';
import {
  ICanvasViewModel,
  INodeViewModel,
  IRootNodeViewModel,
  isBlockNodeViewModel,
  isRootNodeViewModel,
  ITextNodeViewModel
} from './viewModel';
import { Disposable, IDisposable, toDisposable } from '../../base/common/lifecycle';
import { Emitter, Event } from '../../base/common/event';
import { ScopedIdentifier } from '../canvasCommon/scope';
import { IIdentifier } from '../../common/common';
import { Optional } from '../../base/common/typescript';
import { ICanvasModel, IModelService, RootNodeId } from '../../platform/model/common/model';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation';
import { ICanvas } from '../canvas/canvas';
import { isString } from '../../base/common/type';
import { NOTIMPLEMENTED, NOTREACHED } from '../../base/common/notreached';
import { coalesce } from '../../base/common/array';
import { getNodeContent, getNodeFrom, getNodeId, getNodeStyle, getNodeType, YNode, NodeType, isYNode, isYNodeStyle } from '../../common/node';
import { DCHECK } from '../../base/check';
import { getModelNodes, IYNodeModels } from '../../common/model';
import * as Y from 'yjs';

export class CanvasViewModel extends Disposable implements ICanvasViewModel {
  static ID = 1;
  declare readonly _serviceBrand: undefined;

  private id = CanvasViewModel.ID++;

  private readonly _onReconnected: Emitter<void> = this._register(new Emitter<void>());
  public readonly onReconnected: Event<void> = this._onReconnected.event;

  private treeNodeViewModelMap = new Map<string, Map<IIdentifier, INodeViewModel>>();
  private treeNodeObservers = new Map<string, Map<IIdentifier, IDisposable>>();
  private treeNodesObservers = new Map<string, IDisposable>();
  private treeRoots = new Map<string, INodeViewModel>();

  private _root: { value: IRootNodeViewModel };

  private readonly topResource: string;
  constructor(private model: ICanvasModel, instantiationService: IInstantiationService, private modelService: IModelService, private canvas: ICanvas) {
    super();
    this._root = reactive(Object.create(null));
    this.topResource = model.uri.toString();
    this.internal_connect(this.topResource, false);
    Reflect.set(window, 'vm', this);
  }

  internal_disconnect(resourceStr: string): void {
    const nodeObservers = this.treeNodeObservers.get(resourceStr);
    DCHECK(nodeObservers);
    const nodeViewModelMap = this.treeNodeViewModelMap.get(resourceStr);
    DCHECK(nodeViewModelMap);
    const nodesObservers = this.treeNodesObservers.get(resourceStr);
    DCHECK(nodesObservers);
    nodesObservers.dispose();
    for (const [key, value] of nodeObservers.entries()) {
      value.dispose();
    }
    nodeObservers.clear();
    nodeViewModelMap.clear();

    this.treeNodeObservers.delete(resourceStr);
    this.treeNodeViewModelMap.delete(resourceStr);
    this.treeNodesObservers.delete(resourceStr);
  }

  internal_connect(resourceStr: string, emitEvent = false): void {
    this.treeNodeViewModelMap.set(resourceStr, new Map<IIdentifier, INodeViewModel>());
    this.treeNodeObservers.set(resourceStr, new Map<IIdentifier, IDisposable>());

    begin();
    this.processNodes(resourceStr);
    if (resourceStr === this.topResource) {
      this.updateRootOfDefaultTree();
      if (emitEvent) this._onReconnected.fire();
    }
    end();
  }

  dispose() {
    super.dispose();
    this.internal_disconnect(this.topResource);
  }

  getViewModelNodeOfResourceById(id: IIdentifier, resourceStr: string) {
    const nodeViewModelMap = this.treeNodeViewModelMap.get(resourceStr)!;
    return nodeViewModelMap.get(id);
  }

  getViewModelNodeById(id: ScopedIdentifier) {
    const model = this.canvas.getScopedModel(id.scope);
    const nodeViewModelMap = this.treeNodeViewModelMap.get(model.uri.toString())!;
    return nodeViewModelMap.get(id.id);
  }

  get root() {
    if (!this._root.value) {
      this.updateRootOfDefaultTree();
    }
    return this._root;
  }

  private updateRootOfDefaultTree() {
    const vm = this.getViewModelNodeOfResourceById(RootNodeId, this.topResource);
    DCHECK(vm);
    this._root.value = vm as IRootNodeViewModel;
  }

  private getModel(resourceStr: string): ICanvasModel {
    if (resourceStr === this.topResource) return this.model;
    NOTREACHED();
  }

  private processNodes(resourceStr: string) {
    const nodeViewModelMap = this.treeNodeViewModelMap.get(resourceStr)!;
    const model = this.getModel(resourceStr).yModel;
    const nodes = getModelNodes(model);
    DCHECK(nodes);
    const nodeArr = nodes.values() as IterableIterator<YNode>;
    let root: Optional<INodeViewModel>;
    for (const node of nodeArr) {
      const style = getNodeStyle(node) as Y.Map<string>;
      const type = getNodeType(node);
      const id = getNodeId(node);
      DCHECK(isString(id));
      const vm = reactive({
        id,
        children: [],
        style: style ? style.toJSON() : Object.create(null),
        type,
        attrs: Object.create(null)
      } as INodeViewModel);
      if (type === NodeType.Text) {
        ;(vm as ITextNodeViewModel).content = getNodeContent(node);
      }
      const from = getNodeFrom(node);
      if (!from) root = vm;
      nodeViewModelMap.set(id, vm);
      this.watchNode(node, resourceStr);
    }

    if (!root) NOTREACHED();
    this.treeRoots.set(resourceStr, root);

    for (const vm of nodeViewModelMap.values()) {
      if (isBlockNodeViewModel(vm) || isRootNodeViewModel(vm)) {
        vm.children = this.getChildren(vm.id, resourceStr);
      }
    }

    this.watchNodes(nodes, resourceStr);
  }

  private watchNode(node: YNode, resourceStr: string) {
    const nodeViewModelMap = this.treeNodeViewModelMap.get(resourceStr)!;
    const observer = (events: Array<Y.YEvent<any>>) => {
      events.forEach(event => {
        const { target } = event;
        event.changes.keys.forEach((change, key) => {
          const { action, oldValue } = change;
          switch (action) {
            case 'update': {
              if (key === 'from') {
                this.updateChildren(oldValue, resourceStr);
                this.updateChildren(target.get(key), resourceStr);
              } else if (key === 'order') {
                this.updateChildren(getNodeFrom(target), resourceStr);
              } else {
                const id = getNodeId(node);
                const vm = nodeViewModelMap.get(id);
                DCHECK(vm);
                if (isYNode(target)) {
                  // node
                  if (key === 'id') {
                    NOTREACHED();
                  }
                  Reflect.set(vm, key, target.get(key));
                } else if (isYNodeStyle(target)) {
                  DCHECK(vm.style);
                  // @ts-ignore
                  vm.style[key] = target.get(key);
                }
              }
              break;
            }
            case 'add': {
              const nodeId = getNodeId(target);
              if (nodeId) {
                const vm = nodeViewModelMap.get(nodeId);
                DCHECK(vm);
                Reflect.set(vm, key, target.get(key));
              } else {
                const yNodeModel = target.parent;
                const nodeId = getNodeId(yNodeModel);
                DCHECK(nodeId);
                const vm = nodeViewModelMap.get(nodeId);
                DCHECK(vm);
                Reflect.set(vm.style!, key, target.get(key));
              }
              break;
            }
            case 'delete': {
              const id = getNodeId(node);
              if (id) debugger;
              const nodeModel = target.parent;
              const nodeId = getNodeId(nodeModel);
              const vm = nodeViewModelMap.get(nodeId);
              DCHECK(vm);
              Reflect.deleteProperty(vm.style!, key);
              break;
            }
            default:
              NOTREACHED();
          }
        });
      });
    };
    node.observeDeep(observer);
    this.treeNodeObservers.get(resourceStr)!.set(getNodeId(node), toDisposable(() => {
      node.unobserveDeep(observer);
    }));
  }

  private addNode(node: YNode, resourceStr: string) {
    const nodeViewModelMap = this.treeNodeViewModelMap.get(resourceStr)!;
    const id = getNodeId(node);
    nodeViewModelMap.delete(id);
    const style = getNodeStyle(node);
    const type = getNodeType(node);
    const vm = reactive({
      id,
      children: this.getChildren(id, resourceStr),
      style: style ? style.toJSON() : Object.create(null),
      type,
      attrs: Object.create(null),
    }) as INodeViewModel;
    nodeViewModelMap.set(id, vm);
    if (type === NodeType.Text) {
      (vm as ITextNodeViewModel).content = getNodeContent(node);
    }
    this.updateChildren(getNodeFrom(node), resourceStr);
    this.watchNode(node, resourceStr);
  }

  private removeNode(node: YNode, resourceStr: string) {
    const nodeViewModelMap = this.treeNodeViewModelMap.get(resourceStr)!;
    const observers = this.treeNodeObservers.get(resourceStr)!;
    // 删除的只能这样处理
    const id = node._map.get('id')!.content.getContent()[0];
    if (!nodeViewModelMap.has(id)) {
      NOTIMPLEMENTED();
      return;
    }
    nodeViewModelMap.delete(id);
    const from = node._map.get('from')!.content.getContent()[0];
    this.updateChildren(from, resourceStr);
    const observer = observers.get(id);
    DCHECK(observer);
    observer.dispose();
    observers.delete(id);
  }

  private watchNodes(nodes: IYNodeModels, resourceStr: string) {
    const observer = (event: Y.YMapEvent<YNode>) => {
      const { target } = event;
      event.changes.keys.forEach((change, key) => {
        const { action, oldValue } = change;
        switch (action) {
          case 'delete': {
            this.removeNode(oldValue, resourceStr);
            break;
          }
          case 'update': {
            break;
          }
          case 'add':
            this.addNode(target.get(key)!, resourceStr);
            break;
          default:
            NOTREACHED();
        }
      });
    };
    nodes.observe(observer);
    this.treeNodesObservers.set(resourceStr, toDisposable(() => {
      nodes.unobserve(observer);
    }));
  }

  private getChildren(id: IIdentifier, resourceStr: string): INodeViewModel[] {
    const nodeViewModelMap = this.treeNodeViewModelMap.get(resourceStr)!;
    const children = this.getModel(resourceStr).getChildrenNodesOfId(id);
    const vmChildren = children.map(node => {
      const vm = nodeViewModelMap.get(node.id);
      DCHECK(vm);
      return vm;
    });
    return coalesce(vmChildren.filter(Boolean));
  }

  private updateChildren(id: IIdentifier, resourceStr: string) {
    const vm = this.getViewModelNodeOfResourceById(id, resourceStr);
    DCHECK(vm);
    if (!isBlockNodeViewModel(vm) && !isRootNodeViewModel(vm)) NOTREACHED();
    vm.children = this.getChildren(id, resourceStr);
  }
  // #endregion
}
