<template>
  <span class="app-title" ref="topLeftTitleRef" style="min-width: 90px" :style="{ width: `${props.width}px` }">
    <SvgIcon name="app-title" style="height: 16px; width: 16px" />
    {{ title }}
  </span>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import SvgIcon from '@/components/SvgIcon/index.vue';
let props = defineProps({
  title: {
    type: String,
    default: '',
  },
  width: {
    require: false,
    type: String,
  },
});

let topLeftTitleRef = ref(null);

onMounted(() => {});
</script>
<style scoped>
.app-title {
  margin-right: 15px;
  top: 3px;
  position: relative;
}
</style>
