import { INodeModel, NodeType } from './node';
import * as Y from 'yjs';

export interface IDocumentModel {
  nodes: Record<string, INodeModel>;
}

export type IYDocumentModel = Y.Map<IYNodeModels>

export type IYNodeModels = Y.Map<IYNodeModel>

export type IYNodeModel = Y.Map<IYNodeModelValue>

export type IYNodeModelValue = string | Y.Map<string>

export function getModelNodes(m: IYDocumentModel) {
  return m.get('nodes') as IYNodeModels;
}

export function getNodeId(n: IYNodeModel): string {
  return n.get('id') as string;
}

export function getNodeFrom(n: IYNodeModel): string {
  return n.get('from') as string;
}

export function getNodeOrder(n: IYNodeModel): string {
  return n.get('order') as string;
}

export function getNodeType(n: IYNodeModel) {
  return n.get('type') as NodeType;
}

export function getNodeContent(n: IYNodeModel) {
  return n.get('content') as NodeType;
}

export function getNodeStyle(n: IYNodeModel) {
  return n.get('style') as Y.Map<string>;
}
