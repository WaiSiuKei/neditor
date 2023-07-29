import * as Y from 'yjs';
import { INodeModel, YNode } from './node';

export interface IDocumentModel {
  nodes: Record<string, INodeModel>;
}

export type IYDocumentModel = Y.Map<IYNodeModels>

export type IYNodeModels = Y.Map<YNode>

export function getModelNodes(m: IYDocumentModel) {
  return m.get('nodes') as IYNodeModels;
}

