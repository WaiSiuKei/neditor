import { Part } from '../../../workbench/browser/part';
import { createDecorator } from '../../instantiation/common/instantiation';

export const IWorkbenchLayoutService = createDecorator<IWorkbenchLayoutService>('workbenchLayoutService');

export const enum Parts {
  EDITOR_PART = 'workbench.parts.editor',
  TOOLBAT_PART = 'workbench.parts.toolbat',
}

export interface IWorkbenchLayoutService {
  readonly _serviceBrand: undefined;

  readonly container: HTMLElement;
  /**
   * A promise for to await the `isRestored()` condition to be `true`.
   */
  readonly whenRestored: Promise<void>;

  /**
   * Register a part to participate in the layout.
   */
  registerPart(part: Part): void;
}
