import { createDecorator } from '../../instantiation/common/instantiation';
import { ICanvas } from '@neditor/core/canvas/canvas/canvas';
import { IEventFilter } from '../browser/event';

export const IInputService = createDecorator<IInputService>('IInputManager');

export interface IInputService extends IEventFilter {
  _serviceBrand: undefined;

  addTrackedCanvas(canvas: ICanvas): void;
  removeTrackedCanvas(canvas: ICanvas): void;

  // handleOnWillChangeTool(canvas: ICanvas): void;
  // handleOnDidChangeTool(canvas: ICanvas): void;
}

