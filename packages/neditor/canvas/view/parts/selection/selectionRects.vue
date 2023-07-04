<template>
  <template v-for="rect in rects">
    <div class="selection-rect" :style="getStyle(rect)"/>
  </template>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { IRangerRenderingData } from './common';
import { toPX } from '@neditor/core/base/browser/css';

export default defineComponent({
  props: {
    rects: Array,
  },
  methods: {
    getStyle(rect: IRangerRenderingData) {
      return {
        position: 'absolute',
        top: toPX(rect.y),
        left: toPX(rect.x),
        width: toPX(rect.width),
        height: toPX(rect.height)
      } as Partial<CSSStyleDeclaration>;
    }
  }
});
</script>
<style>
.selection-rect {
  background: blue;
  opacity: 40%;
}
</style>
