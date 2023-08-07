import { isFunction } from '../../../../../../base/common/type';
import { Editor, EditorInterface } from '../interfaces/editor';

export const isEditor: EditorInterface['isEditor'] = (
  value: any
): value is Editor => {
  const func = Reflect.get(value, 'isEditor');
  return func && isFunction(func) && func.call(value);
};
