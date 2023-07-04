import { GenericRegistry } from '../../registry/common/genericRegistry';
import { IToolRegistry, IToolFactory, Tool } from './tool';
import { Registry } from '../../registry/common/platform';
import { Optional } from '../../../base/common/typescript';

export class ToolRegistry extends GenericRegistry<IToolFactory> implements IToolRegistry {
  private _defaultToolID: Optional<string>;
  registerWithShortcut(factory: IToolFactory, asDefaultTool?: boolean): void {
    this.add(factory);
    if (asDefaultTool) {
      this._defaultToolID = factory.id;
    }
  }
  getDefaultOne() {
    return this._defaultToolID;
  }
}

Registry.add(Tool, new ToolRegistry());
