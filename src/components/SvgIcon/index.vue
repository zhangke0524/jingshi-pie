<!-- src/components/SvgIcon.vue -->
<template>
  <component :is="iconComponent" class="svg-icon" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import icons from '@/assets/icons' // 自动导入所有 SVG

const props = defineProps<{
  name: string
}>()

const iconComponent = computed(() => icons[props.name])
</script>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: middle;
  fill: currentColor;
}
</style>
