import { DCHECK } from '../../../../base/check';
import { ICanvasModelLike, INodeInit, IOperationCallback, } from '../model';
import { DirectionType, ILocation } from '../location';
import { YNodeBase, YNodeValue, NodeType } from '../../../../common/node';
import { generateUuid } from '../../../../base/common/uuid';
import { cmp, devideBy2, plus } from '../../../../base/common/bignumber';
import { NOTIMPLEMENTED, NOTREACHED } from '../../../../base/common/notreached';
import { IIdentifier } from '../../../../common/common';
import { Optional } from '../../../../base/common/typescript';
import { isNil, isObject, isString } from '../../../../base/common/type';
import { getModelNodes} from '../../../../common/model';
import * as Y from 'yjs';
import { keys } from '../../../../base/common/objects';

export function insertNodeOperation(at: ILocation, nodeInit: INodeInit): IOperationCallback<YNodeBase> {
  return (model: ICanvasModelLike) => {
    const { ref, direction } = at;
    const nodeId = generateUuid();
    const node = new Y.Map<YNodeValue>();
    node.set('id', nodeId);
    keys(nodeInit).forEach(key => {
      const v = nodeInit[key];
      if (isString(v)) {
        node.set(key, v);
      } else if (isObject(v)) {
        DCHECK(key === 'style');
        const map = new Y.Map<string>();
        keys(v).forEach(k => {
          map.set(k, v[k]);
        });
        node.set(key, map);
      } else {
        NOTIMPLEMENTED();
      }
    });

    // 添加到子元素
    if (direction === DirectionType.inward) {
      // 默认添加到最后
      const children = model.getChildrenNodesOfId(ref);
      node.set('from', ref);
      if (children.length) {
        const sorted = children.sort((a, b) => cmp(b.get('order') as string, a.get('order') as string));
        node.set('order', devideBy2(plus('1', sorted[0].get('order') as string)));
      } else {
        node.set('order', '0.5');
      }
    } else if (direction === DirectionType.backward || direction === DirectionType.forward) {
      const parent = model.getParentNodeOfId(ref);
      if (!parent) {
        throw new Error('404');
      }
      node.set('from', parent.get('id') as string);
      const refNode = model.getNodeById(ref);
      DCHECK(refNode);
      const order = refNode.get('order') as string;
      DCHECK(order);
      if (direction === DirectionType.backward) {
        const next = model.getNextSiblingNodeOfId(ref);
        const nextOrder = next ? next.get('order') as string : '1';
        node.set('order', devideBy2(plus(order!, nextOrder)));
      } else {
        const pre = model.getPreviousSiblingNodeOfId(ref);
        const preOrder = pre ? pre.get('order') as string : '0';
        if (preOrder === '0') {
          node.set('order', devideBy2(order));
        } else {
          node.set('order', devideBy2(plus(order, preOrder)));
        }
      }
    } else {
      NOTIMPLEMENTED();
    }
    model.yModel.get('nodes')!.set(nodeId, node);
    return node;
  };
}

export function removeNodeOperation(at: ILocation): IOperationCallback<void> {
  return (model: ICanvasModelLike) => {
    const { ref, direction = DirectionType.self } = at;
    switch (direction) {
      case DirectionType.forward:
      case DirectionType.backward:
        deleteSibling(model, ref, direction);
        break;
      case DirectionType.inward:
        deleteChildren(model, ref);
        break;
      case DirectionType.self:
        deleteIt(model, ref);
        break;
      default:
        NOTIMPLEMENTED();
    }
  };

}

function deleteSibling(model: ICanvasModelLike, id: IIdentifier, direction: DirectionType): void {
  const node = model.getNodeById(id);
  DCHECK(node);
  const from = node.get('from') as string;
  DCHECK(from);

  const siblings = model.getChildrenNodesOfId(from).sort((a, b) => cmp(a.get('order') as string, b.get('order') as string));
  const idxOfSelf = siblings.indexOf(node);
  if (direction === DirectionType.forward) {
    if (idxOfSelf === 0) {
      throw new Error('400');
    }
    deleteIt(model, siblings[idxOfSelf - 1].get('id') as string);
  } else if (direction === DirectionType.backward) {
    if (idxOfSelf === siblings.length - 1) {
      throw new Error('400');
    }
    deleteIt(model, siblings[idxOfSelf + 1].get('id') as string);
  } else {
    NOTREACHED();
  }
}

function deleteChildren(model: ICanvasModelLike, id: IIdentifier) {
  const children = model.getChildrenNodesOfId(id);
  for (let i = 0, len = children.length; i < len; i++) {
    deleteIt(model, children[i].get('id') as string);
  }
}

function deleteIt(model: ICanvasModelLike, id: IIdentifier) {
  deleteChildren(model, id);

  const nodes = getModelNodes(model.yModel);
  nodes.delete(id);
}

export function reparentNodeOperation(id: IIdentifier, newParent: IIdentifier, referenceNodeId: Optional<IIdentifier>) {
  return (model: ICanvasModelLike) => {
    const childrenOfNext = model.getChildrenNodesOfId(newParent).sort((a, b) => cmp(a.get('order') as string, b.get('order') as string));
    const node = model.getNodeById(id);
    DCHECK(node);
    node.set('from', newParent);
    if (isNil(referenceNodeId)) {
      if (childrenOfNext.length) {
        // 放到最后
        node.set('order', devideBy2(plus(childrenOfNext[childrenOfNext.length - 1].get('order') as string, '1')));
      } else {
        node.set('order', '0.5');
      }
    } else {
      const nextSibling = model.getNodeById(referenceNodeId);
      if (!nextSibling) NOTREACHED();
      const nextSiblingIndex = childrenOfNext.indexOf(nextSibling);
      if (nextSiblingIndex === 0) {
        node.set('order', devideBy2(nextSibling.get('order') as string));
      } else {
        const prevSibling = childrenOfNext[nextSiblingIndex - 1];
        node.set('order', devideBy2(plus(prevSibling.get('order') as string, nextSibling.get('order') as string)));
      }
    }
  };
}

export function reorderNodeOperation(id: IIdentifier, beforeSiblingNodeId: Optional<IIdentifier>) {
  return (model: ICanvasModelLike) => {
    const parent = model.getParentNodeOfId(id)!;
    const siblings = model.getChildrenNodesOfId(parent.get('id') as string).sort((a, b) => cmp(a.get('order') as string, b.get('order') as string));
    const node = model.getNodeById(id);
    DCHECK(node);
    DCHECK(node.get('from') === parent.get('id'));
    if (isNil(beforeSiblingNodeId)) {
      if (siblings.length) {
        // 放到最后
        node.set('order', devideBy2(plus(siblings[siblings.length - 1].get('order') as string, '1')));
      } else {
        node.set('order', '0.5');
      }
    } else {
      const nextSibling = model.getNodeById(beforeSiblingNodeId)!;
      const nextSiblingIndex = siblings.indexOf(nextSibling);
      if (nextSiblingIndex === 0) {
        node.set('order', devideBy2(nextSibling.get('order') as string));
      } else {
        const prevSibling = siblings[nextSiblingIndex - 1];
        if (prevSibling.get('id') !== id) {
          node.set('order', devideBy2(plus(prevSibling.get('order') as string, nextSibling.get('order') as string)));
        }
      }
    }
  };
}
