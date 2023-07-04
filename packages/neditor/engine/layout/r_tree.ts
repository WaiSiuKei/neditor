import RBush from 'rbush';
import type { TextBox } from "./text_box";

export interface IRTreeItem {
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
}

export type RTree<T extends IRTreeItem = IRTreeItem> = RBush<T>

export interface ITextBoxRTreeItem extends IRTreeItem {
  box: TextBox
}

export function textBoxToRTreeItem(box: TextBox) {
  const rect = box.GetClientRect();
  return {
    minX: rect.left().toFloat(),
    minY: rect.top().toFloat(),
    maxX: rect.right().toFloat(),
    maxY: rect.bottom().toFloat(),
    box,
  }
}
