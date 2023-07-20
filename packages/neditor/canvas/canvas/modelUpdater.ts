import { IScopedLocation } from '../../platform/model/common/location';
import { ICanvas, IModelFacade, IScopedNodeModel } from './canvas';
import { INodeInit } from '../../platform/model/common/model';
import { RootScope, Scope, ScopedIdentifier } from '../canvasCommon/scope';
import { Optional } from '../../base/common/typescript';
import { NOTIMPLEMENTED, NOTREACHED } from '../../base/common/notreached';

// export class ModelUpdater implements IModelFacade {
//   constructor(protected canvas: ICanvas) {}
//
//   /**
//    * 添加节点，待定
//    */
//   addNode(at: IScopedLocation, init: INodeInit): IScopedNodeModel {
//     const ret = this.canvas.getScopedModel(at.scope).addNode(at, init);
//     return { ...ret, scope: at.scope, };
//   }
//
//   /**
//    * 删除节点
//    * @param at - 位置
//    */
//   removeNode(at: IScopedLocation): void {
//     this.canvas.getScopedModel(at.scope).removeNode(at);
//   }
//
//   /**
//    * 删除多个节点
//    * @param ids
//    */
//   removeNodes(ids: ScopedIdentifier[]): void {
//     const idsGroupByScope = new Map<Scope, string[]>();
//     for (const id of ids) {
//       if (!idsGroupByScope.has(id.scope)) {
//         idsGroupByScope.set(id.scope, []);
//       }
//       idsGroupByScope.get(id.scope)!.push(id.id);
//     }
//     for (const [scope, ids] of idsGroupByScope.entries()) {
//       this.canvas.getScopedModel(scope).removeNodes(ids);
//     }
//   }
//
//   /**
//    * 改变节点的父元素
//    * @param id
//    * @param newParent
//    * @param referenceNodeId - 新位置后面的兄弟节点的 id； null 代表作为最后一个元素
//    */
//   reparentNode(id: ScopedIdentifier, newParent: ScopedIdentifier, referenceNodeId?: Optional<ScopedIdentifier>): void {
//     if (id.scope !== newParent.scope) NOTIMPLEMENTED();
//     this.canvas.getScopedModel(id.scope).reparentNode(id.id, newParent.id, referenceNodeId?.id);
//   }
//
//   /**
//    * 移动目标节点
//    * @param id - 目标节点
//    * @param beforeSiblingNodeId - 新位置后面的兄弟节点的 id； null 代表作为最后一个元素
//    */
//   reorderNode(id: ScopedIdentifier, beforeSiblingNodeId?: Optional<ScopedIdentifier>): void {
//     if (beforeSiblingNodeId && beforeSiblingNodeId.scope !== id.scope) NOTIMPLEMENTED();
//     this.canvas.getScopedModel(id.scope).reorderNode(id.id, beforeSiblingNodeId?.id);
//   }
//
//   /**
//    * 更新节点
//    * @param target
//    * @param props
//    */
//   updateNodeById(target: ScopedIdentifier, props: Partial<INodeInit>): void {
//     this.canvas.getScopedModel(target.scope).updateNodeById(target.id, props);
//   }
//
//   /**
//    * 根据 id 获取节点数据
//    */
//   getNodeById(id: ScopedIdentifier): Optional<IScopedNodeModel> {
//     const n = this.canvas.getScopedModel(id.scope).getNodeById(id.id);
//     if (!n) return undefined;
//     return {
//       ...n,
//       scope: id.scope,
//     };
//   }
//
//   /**
//    * 获取父节点
//    */
//   getParentNodeOfId(id: ScopedIdentifier): Optional<IScopedNodeModel> {
//     const parentNode = this.canvas.getScopedModel(id.scope).getParentNodeOfId(id.id);
//     if (id.scope === RootScope && parentNode) {
//       return {
//         ...parentNode,
//         scope: id.scope,
//       };
//     }
//     const node = this.canvas.getScopedModel(id.scope).getNodeById(id.id)!;
//     if (!node.from) {
//       const parentScope = id.scope.parent!;
//       const n = this.canvas.getScopedModel(parentScope).getNodeById(id.scope.name);
//       if (!n) NOTREACHED();
//       return {
//         ...n,
//         scope: parentScope,
//       };
//     }
//     return undefined;
//   }
//
//   /**
//    * 获取相邻前节点
//    */
//   getPreviousSiblingNodeOfId(id: ScopedIdentifier): Optional<IScopedNodeModel> {
//     const n = this.canvas.getScopedModel(id.scope).getPreviousSiblingNodeOfId(id.id);
//     return n ? { ...n, scope: id.scope } : undefined;
//   }
//
//   /**
//    * 获取相邻后节点
//    */
//   getNextSiblingNodeOfId(id: ScopedIdentifier): Optional<IScopedNodeModel> {
//     const n = this.canvas.getScopedModel(id.scope).getNextSiblingNodeOfId(id.id);
//     return n ? { ...n, scope: id.scope } : undefined;
//   }
//
//   /**
//    * 获取祖先节点列表，根节点在前
//    * @param i - 查询的节点的 id
//    */
//   getAncestorNodesOfId(i: ScopedIdentifier): IScopedNodeModel[] {
//     if (i.scope.EQ(RootScope)) {
//       return this.canvas.model!.getAncestorNodesOfId(i.id).map(n => ({ ...n, scope: RootScope }));
//     } else {
//       let ret: IScopedNodeModel[] = [];
//       let count = 10;
//       while (true) {
//         count--;
//         if (count < 0) NOTREACHED();
//         const model = this.canvas.getScopedModel(i.scope);
//         ret = model
//           .getAncestorNodesOfId(i.id)
//           .map(n => ({ ...n, scope: i.scope }))
//           .concat(ret);
//         if (i.scope === RootScope) return ret;
//         i = ScopedIdentifier.create(i.scope.name, i.scope.parent!);
//       }
//       NOTREACHED();
//     }
//   }
//
//   getNodePathInTree(i: ScopedIdentifier, includeSelf = true): ScopedIdentifier[] {
//     if (i.scope.EQ(RootScope)) {
//       const p = this.canvas.model!.getAncestorNodesOfId(i.id);
//       if (includeSelf) {
//         p.push(this.canvas.model!.getNodeById(i.id)!);
//       }
//
//       return p.map(n => ScopedIdentifier.create(n.id, RootScope));
//     } else {
//       const path: ScopedIdentifier[] = [];
//
//       for (const s of i.scope) {
//         if (s.EQ(RootScope)) continue;
//         const parentScope = s.parent!;
//         const model = this.canvas.getScopedModel(parentScope);
//         const p = model.getAncestorNodesOfId(s.name);
//         path.push(...p.map(n => ScopedIdentifier.create(n.id, parentScope)));
//       }
//       if (includeSelf) {
//         path.push(i);
//       }
//       return path;
//     }
//   }
//
//   /**
//    * 是否为祖先节点
//    * @param ancestorId - 查询的节点的 id
//    * @param id - 被查询的节点的 id
//    */
//   isAncestorNodeOfId(ancestorId: ScopedIdentifier, id: ScopedIdentifier): boolean {
//     const path = this.getNodePathInTree(id);
//     return path.some(p => p.EQ(ancestorId));
//   }
//
//   getChildrenNodesOfId(id: ScopedIdentifier): IScopedNodeModel[] {
//     let i = id;
//     let count = 10;
//     while (i) {
//       count--;
//       if (count < 0) NOTREACHED();
//       const model = this.canvas.getScopedModel(i.scope);
//       const n = model.getNodeById(i.id);
//       if (!n) NOTREACHED();
//       // if (isFragmentNode(n)) {
//       //   const fragmentScope = i.scope.createChild(i.id);
//       //   const fragmentModel = this.canvas.getScopedModel(fragmentScope);
//       //   const roots = fragmentModel.queryNodes(n => !n.from);
//       //   if (roots.length !== 1) NOTREACHED();
//       //   const root = roots[0];
//       //   if (isFragmentNode(root)) {
//       //     i = ScopedIdentifier.create(root.id, fragmentScope);
//       //     continue;
//       //   }
//       // }
//       return model.getChildrenNodesOfId(n.id).map(n => ({ ...n, scope: i.scope }));
//     }
//     NOTREACHED();
//   }
//
//   /**
//    * 获取符合条件的节点列表
//    */
//   queryNodes(condition: (s: Scope, n: INodeModel) => boolean): IScopedNodeModel[] {
//     const scopeToVisit = [RootScope];
//     const ret: IScopedNodeModel[] = [];
//     const vistedFragment = new Set<string>();
//
//     let count = 10;
//     while (scopeToVisit.length) {
//       count--;
//       if (count < 0) NOTREACHED();
//       const scope = scopeToVisit.shift()!;
//
//       const model = this.canvas.getScopedModel(scope);
//       ret.push(...model.queryNodes(condition.bind(null, scope)).map(n => ({ ...n, scope })));
//
//       // const fragmentNodes = model.queryNodes(n => isFragmentNode(n));
//       // for (const fragmentNode of fragmentNodes) {
//       //   const fragmentSrc = fragmentNode.props.fragmentSrc!;
//       //   if (vistedFragment.has(fragmentSrc)) continue;
//       //   vistedFragment.add(fragmentSrc);
//       //   scopeToVisit.push(scope.createChild(fragmentNode.id));
//       // }
//     }
//
//     return ret;
//   }
//   // #endregion
// }
