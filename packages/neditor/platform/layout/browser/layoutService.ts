import { createDecorator } from '@neditor/core/platform/instantiation/common/instantiation';

export const ILayoutService = createDecorator<ILayoutService>('layoutService');

export interface ILayoutService {
  readonly _serviceBrand: undefined;
}
