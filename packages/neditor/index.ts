import 'normalize.css';
// import '@neditor/core/platform/tool/common/toolRegistry';
// import '@neditor/core/platform/tool/browser/toolService';
// import '@neditor/core/platform/input/browser/inputService';
// import '@neditor/core/platform/canvas/common/canvasService';
// import '@neditor/core/platform/model/common/modelService';
// import '@neditor/core/platform/keybinding/browser/keybindingService';
// import '@neditor/core/platform/contextkey/browser/contextKeyService';
// import '@neditor/core/platform/undoRedo/common/undoRedoService';
// import '@neditor/core/platform/lifecycle/browser/lifecycleService';
// import '@neditor/core/platform/commands/common/commandService';
// import '@neditor/core/workbench/browser/parts/editor/editorPart';
// import '@neditor/core/workbench/contrib/action/action.contributions';
// import '@neditor/core/workbench/contrib/tool/tool.contributions';
// import { create } from './workbench/browser/web.factory';
// // import './editor';
//
// create(document.body, {});

import { reactive } from './platform/model/common/reactivity/reactive';
import { produce, undoPathes, redoPatches } from './platform/model/common/reactivity/patch';

const obj = [1, 2, 3, 4, 5, 6, 7];
const proxy = reactive(obj);
const patches = produce(() => {
  proxy.splice(1, 3)
});
console.log(patches)
console.log('after', proxy);
undoPathes(proxy, patches);
console.log('undo', proxy);

redoPatches(proxy, patches);
console.log('redo', proxy);
