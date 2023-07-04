<template>
  <button
    :class="{button_active : isActive, button: true}"
    @click="onClick"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>
<script lang="ts" setup>
type Props = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
};
const props = defineProps<Props>()
</script>

<style>
.button {
  margin: 1px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 12px;
  color: var(--color-foreground-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.button:not(.button_active):not(:disabled):hover,
.button:not(.button_active):not(:disabled):focus {
  background-color: var(--colors-hover);
}

.button:disabled {
  opacity: 0.5;
  cursor: default;
}

.button_active {
  color: white;
  background-color: var(--colors-selected);
  outline: none;
}

.button svg {
  width: 20px;
  height: 20px;
}
</style>

