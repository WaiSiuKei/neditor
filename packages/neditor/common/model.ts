import * as Y from 'yjs';
import { INodeModel, YNodeBase } from './node';

export interface IDocumentModel {
  nodes: Record<string, INodeModel>;
}

export type IYDocumentModel = Y.Map<IYNodeModels>

export type IYNodeModels = Y.Map<YNodeBase>

export function getModelNodes(m: IYDocumentModel) {
  return m.get('nodes') as IYNodeModels;
}

