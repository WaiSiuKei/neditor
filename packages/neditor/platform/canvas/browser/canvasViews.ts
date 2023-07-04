import { createDecorator } from '../../instantiation/common/instantiation';

export const ICanvasViewsService = createDecorator<ICanvasViewsService>('ICanvasViewsService');

export interface ICanvasViewsService {
  readonly _serviceBrand: undefined;

  readonly isReady: boolean;
  readonly whenReady: Promise<void>;
  readonly whenRestored: Promise<void>;

  restore(): void | Promise<void>;
  create(parent: HTMLElement): void;
}
