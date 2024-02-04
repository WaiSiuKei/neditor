import { RecordType } from '../../common/node';
import { getTypeAttr } from '../viewModel/path';
import { CanvasElement } from './types';

export function isTextElement(el: CanvasElement) {
  return getTypeAttr(el) === NodeType.Text;
}
export function isBlockElement(el: CanvasElement) {
  return getTypeAttr(el) === NodeType.Block;
}
export function isImageElement(el: CanvasElement) {
  return getTypeAttr(el) === NodeType.Image;
}
