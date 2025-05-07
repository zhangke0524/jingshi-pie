<script setup>
import pieChart from './components/pieChart.vue'
import { res } from './utils/mockPieData'
</script>

<template>
  <div class="main-content-zk">
    <pie-chart :data="res.data" :title="'饼图'" />
  </div>
</template>

<style scoped>
.main-content-zk {
  /* width: 800px;
  height: 800px; */
  background-color: #f1e2e2;
  width: 100%;
  height: 100%;
}
</style>
