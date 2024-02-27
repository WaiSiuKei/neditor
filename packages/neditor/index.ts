import 'normalize.css';
import '@neditor/core/platform/tool/common/toolRegistry';
import '@neditor/core/platform/tool/browser/toolService';
import '@neditor/core/platform/input/browser/inputService';
import '@neditor/core/platform/canvas/common/canvasService';
import '@neditor/core/platform/model/common/modelService';
import '@neditor/core/platform/keybinding/browser/keybindingService';
import '@neditor/core/platform/contextkey/browser/contextKeyService';
import '@neditor/core/platform/undoRedo/common/undoRedoService';
import '@neditor/core/platform/lifecycle/browser/lifecycleService';
import '@neditor/core/platform/commands/common/commandService';

import '@neditor/core/workbench/browser/parts/editor/editorPart';
// import '@neditor/core/workbench/contrib/action/action.contributions';
// import '@neditor/core/workbench/contrib/tool/tool.contributions';

import { create } from './workbench/browser/web.factory';

create(document.body, {});
