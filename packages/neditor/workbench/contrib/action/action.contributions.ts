import { KeyCode } from '@neditor/core/base/common/keyCodes';
import { KeybindingsRegistry, KeybindingWeight } from "../../../platform/keybinding/common/keybindingsRegistry";
import {
  CancelToolAction,
  IToolService,
  ToolContextKeys,
  ToolInvocationPhase
} from "../../../platform/tool/common/tool";

KeybindingsRegistry.registerCommandAndKeybindingRule({
  id: CancelToolAction,
  primary: KeyCode.Escape,
  when: ToolContextKeys.currentToolState.notEqualsTo(ToolInvocationPhase.noop),
  weight: KeybindingWeight.EditorCore,
  handler(accessor, args) {
    const toolService = accessor.get<IToolService>(IToolService)
    toolService.switchDefault()
  }
})
