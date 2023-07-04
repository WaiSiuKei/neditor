<template>
  <div class="outline" :style="outlineStyle"></div>
</template>
<script lang="ts" setup>
import { IOutlineInit } from '../../view';
import { computed } from 'vue';

type Props = {
  outlines: IOutlineInit[]
};

const outlineStyle = computed(() => {
  if (!props.outlines.length) return {
    display: 'none'
  };
  const first = props.outlines[0];
  return {
    top: first.top - 1,
    left: first.left - 1,
    width: first.width + 2,
    height: first.height + 2,
  };
});

const props = defineProps<Props>();
</script>
<style scoped>
.outline {
  position: absolute;
  box-sizing: border-box;
  border-width: 1px;
  border-color: #0044ff;
}
</style>
