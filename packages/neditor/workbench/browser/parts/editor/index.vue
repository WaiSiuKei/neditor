<template>
  <div ref="container" class="editor"></div>
</template>
<script lang="ts" setup>
import { onMounted, ref, inject } from 'vue';
import { Injects } from '../injects';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation';
import { NOTREACHED } from '../../../../base/common/notreached';
import { ICanvasViewsService } from '../../../../platform/canvas/browser/canvasViews';
import { assertIsDefined } from '../../../../base/common/type';

const container = ref<HTMLElement>();

onMounted(() => {
  const instantiationService = inject<IInstantiationService>(Injects.instantiationService);
  if (!instantiationService) NOTREACHED();
  instantiationService.invokeFunction((accessor) => {
    const editorPart = accessor.get<ICanvasViewsService>(ICanvasViewsService);
    editorPart.create(assertIsDefined(container.value));
    editorPart.whenRestored.then(() => {
      document.querySelector('.loader-container')!.remove();
    });
  });
});
</script>
<style>
.editor {
  width: 100vw;
  height: 100vh;
  position: fixed;

  background: #F5F6F7;
}
</style>
