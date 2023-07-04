import { EnumAndLiteral } from '@neditor/core/base/common/typescript';
import { Iterable } from '@neditor/core/base/common/iterator';
import some = Iterable.some;
import { PathInfo } from '@neditor/core/platform/input/browser/event';

export const enum MouseTargetType {
  /**
   * Mouse is on top of an unknown element.
   */
  Unknown,
  /**
   * 画布
   */
  Canvas,
}

