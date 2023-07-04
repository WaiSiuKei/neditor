import { Registry } from '@neditor/core/platform/registry/common/platform';
import { IToolRegistry, IToolService, Tool } from '@neditor/core/platform/tool/common/tool';
import { SelectToolFactory, SelectToolID } from './select/selectTool';
import { PanToolFactory, PanToolID } from './pan/panTool';
import { BrushToolFactory, BrushToolID } from './brush/brushTool';
import { LineToolFactory, LineToolID } from './line/lineTool';
import { TextToolFactory, TextToolID } from './text/textTool';
import { EraserToolFactory, EraserToolID } from './eraser/eraserTool';
import { RectToolFactory, RectToolID } from './rect/rectTool';
import { HoverToolFactory, HoverToolID } from './hover/hoverTool';
import {
  IKeybindings,
  KeybindingsRegistry, KeybindingWeight
} from "../../../platform/keybinding/common/keybindingsRegistry";
import { KeyCode } from "../../../base/common/keyCodes";

const toolRegistry = Registry.as<IToolRegistry>(Tool);

toolRegistry.registerWithShortcut(new SelectToolFactory());
toolRegistry.registerWithShortcut(new HoverToolFactory(), true);
toolRegistry.registerWithShortcut(new PanToolFactory());
toolRegistry.registerWithShortcut(new LineToolFactory());
toolRegistry.registerWithShortcut(new BrushToolFactory());
toolRegistry.registerWithShortcut(new TextToolFactory());
toolRegistry.registerWithShortcut(new EraserToolFactory());
toolRegistry.registerWithShortcut(new RectToolFactory());

function registerToolKeybinding(id: string, keybinding: IKeybindings) {
  KeybindingsRegistry.registerCommandAndKeybindingRule({
    id,
    ...keybinding,
    weight: KeybindingWeight.WorkbenchContrib,
    handler(acccessor) {
      const toolService = acccessor.get<IToolService>(IToolService)
      toolService.switchTool(id)
    }
  })
}

registerToolKeybinding(SelectToolID, { primary: KeyCode.KEY_S })
registerToolKeybinding(HoverToolID, { primary: KeyCode.KEY_H })
registerToolKeybinding(PanToolID, { primary: KeyCode.KEY_P })
registerToolKeybinding(LineToolID, { primary: KeyCode.KEY_L })
registerToolKeybinding(BrushToolID, { primary: KeyCode.KEY_B })
registerToolKeybinding(TextToolID, { primary: KeyCode.KEY_T })
registerToolKeybinding(EraserToolID, { primary: KeyCode.KEY_E })
registerToolKeybinding(RectToolID, { primary: KeyCode.KEY_R })
