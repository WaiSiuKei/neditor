import { RawContextKey } from '../../platform/contextkey/common/contextkey';
import { HitTestLevel } from '../../platform/input/common/input';

export namespace CanvasContextKeys {
  export const hitTestLevel = new RawContextKey<HitTestLevel>('hitTestLevel', HitTestLevel.BlockBox);
  export const isEditingText = new RawContextKey<boolean>('isEditingText', false);
}
