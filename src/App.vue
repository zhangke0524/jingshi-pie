<script setup>
import pieChart from './components/pieChart.vue'
import { res } from './utils/mockPieData'
import barChart from './components/barChart.vue'
import { res as barRes } from './utils/mockBarData'
</script>

<template>
  <div class="main-content-zk">
    <div class="list-item">
      <pie-chart :data="res.data" :title="'饼图'"  />
    </div>
    <div class="list-item">
      <bar-chart :data="barRes.data" :title="'柱状图'" />
    </div>
  </div>
</template>

<style scoped>
.main-content-zk {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}
.list-item {
  flex: 0 0 50%;
  height: 100%;
  background-color: #fff;
  border: 1px solid #ddd8d8;
  border-radius: 5px;
}
</style>
