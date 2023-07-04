<template>
  <div class="tools_panel_container">
    <div class="tools_panel">
      <div class="tools_panel_section">
        <SelectionButton :is-active="states[HoverToolID]" :on-click="handlers[HoverToolID]"/>
        <PanButton :is-active="states[PanToolID]" :on-click="handlers[PanToolID]"/>
        <PencilButton :is-active="states[BrushToolID]" :on-click="handlers[BrushToolID]"/>
        <EraserButton :is-active="states[EraserToolID]" :on-click="handlers[EraserToolID]"/>
        <RectangleButton :is-active="states[RectToolID]" :on-click="handlers[RectToolID]"/>
        <TextButton :is-active="states[TextToolID]" :on-click="handlers[TextToolID]"/>
      </div>
      <div class="seperator"></div>
      <div class="tools_panel_section">
        <UndoButton :onClick="undo" :disabled="!undoRedoStatue.canUndo"/>
        <RedoButton :onClick="redo" :disabled="!undoRedoStatue.canRedo"/>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import SelectionButton from './SelectionButton.vue';
import PanButton from './PanButton.vue';
import PencilButton from './PencilButton.vue';
import RectangleButton from './RectangleButton.vue';
import EraserButton from './EraserButton.vue';
import TextButton from './TextButton.vue';
import UndoButton from './UndoButton.vue';
import RedoButton from './RedoButton.vue';

import { inject, reactive } from 'vue';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation';
import { Injects } from '../injects';
import { IToolService } from '../../../../platform/tool/common/tool';
import { BrushToolID } from '../../../contrib/tool/brush/brushTool';
import { LineToolID } from '../../../contrib/tool/line/lineTool';
import { RectToolID } from '../../../contrib/tool/rect/rectTool';
import { EraserToolID } from '../../../contrib/tool/eraser/eraserTool';
import { TextToolID } from '../../../contrib/tool/text/textTool';
import { HoverToolID } from '../../../contrib/tool/hover/hoverTool';
import { PanToolID } from '../../../contrib/tool/pan/panTool';
import { ICanvasService } from "../../../../platform/canvas/common/canvas";

const instantiationService = inject<IInstantiationService>(Injects.instantiationService)!;
const toolService = instantiationService.invokeFunction(accessor => accessor.get<IToolService>(IToolService));
const canvasService = instantiationService.invokeFunction(accessor => accessor.get(ICanvasService))

const states: Record<string, boolean> = reactive({
  [HoverToolID]: false,
  [PanToolID]: false,
  [BrushToolID]: false,
  [LineToolID]: false,
  [RectToolID]: false,
  [EraserToolID]: false,
  [TextToolID]: false,
});
const handlers = Object.create(null);
Object.keys(states).forEach(key => {
  handlers[key] = () => {
    toolService.switchTool(key);
  };
});
toolService.onDidChangeTool(e => {
  const { prev, next } = e;
  if (next) {
    states[next.id] = true;
  }
  if (prev) {
    states[prev.id] = false;
  }
});

const undoRedoStatue = reactive({
  canUndo: false,
  canRedo: false,
})
const undo = () => {
  canvasService.getActiveCanvas()?.undo()
};

const redo = () => {
  canvasService.getActiveCanvas()?.redo()
};
canvasService.onDidActiveCanvasChange(canvas => {
  canvas.onDidChangeModelContent(e => {
    undoRedoStatue.canUndo = canvas.canUndo()
    undoRedoStatue.canRedo = canvas.canRedo()
  })
})


</script>
<style scoped>
.tools_panel_container {
  position: absolute;
  bottom: 11px;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tools_panel {
  box-shadow: var(--shadow-popup);
  border-radius: 12px;
  background-color: var(--color-surface-panel);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tools_panel_section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.seperator {
  width: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  align-self: stretch;
}
</style>
