import { IBlockRecord } from './types/block';
import { IFragmentRecord } from './types/fragment';
import { IRootRecord } from './types/root';
import { ITextRecord } from './types/text';

export type IDocumentRecord =
  | ITextRecord
  | IBlockRecord
  | IRootRecord
  // | IFragmentRecord

export interface IDocument {
  nodes: Record<string, IDocumentRecord>;
}

export type { ITextRecord, IBlockRecord, IRootRecord, IFragmentRecord };
