<template>
  <div class="w-full h-full">
    <div class="main-bar p5">
      <div class="each-title">
        <SvgIcon name="app-title" style="height: 16px; width: 16px" />
        <span>{{ props.title }}</span>
      </div>
      <el-select
        v-model="barTimeFive"
        placeholder="请选择"
        @change="chooseBarTime"
      >
        <el-option
          v-for="item in timeFiveList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div class="bar-chart-content relative">
      <div ref="echartBarRef" class="bar-chart"></div>
      <div
        class="absolute empty-info-data"
        :class="{
          'show-empty-icon':
            !currentBarDataAll || !currentBarDataAll.length || !barData.length,
          'not-show-empty-icon':
            currentBarDataAll && currentBarDataAll.length && barData.length,
        }"
      >
        <SvgIcon name="empty-data-gien" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from "vue";
import * as echarts from "echarts";
import { pieColorList } from "@/utils/constants";

const props = defineProps({
  // 饼图数据
  data: {
    type: Array,
    default: () => [],
  },
  // 饼图颜色
  colorList: {
    type: Array,
    default: pieColorList,
  },
  // 饼图标题
  title: {
    type: String,
    default: "",
  },
});

// 根据当前的主题，设置饼图的颜色
const colorList = props.colorList;

const barTimeFive = ref("day");
// 柱状图(摄像机频发top10)接口返回的全部数据
const currentBarDataAll = ref(null);
const barData = ref([]);
const barNameList = ref([]);
const echartBarRef = ref(null);
let myBarChart = ref(null);

const timeFiveList = computed(() => {
  return [
    { value: "day", label: "日" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
    { value: "season", label: "季" },
    { value: "year", label: "年" },
  ];
});
const state = reactive({
  barOption: {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {},
    grid: {
      // 防止标签溢出
      containLabel: true,
      top: 10,
      left: 10,
      right: "10%",
      bottom: 10,
    },
    xAxis: {
      type: "value",
      boundaryGap: [0, 0.01],
      nameRotate: 45,
      axisTick: {
        show: false, // 是否显示坐标轴刻度 默认显示
      },
      axisLine: {
        // 是否显示坐标轴轴线 默认显示
        show: false, // 是否显示坐标轴轴线 默认显示
        lineStyle: {
          // 坐标轴线线的颜色
          color: "#747393",
        },
      },
      axisLabel: {
        // 是否显示刻度标签 默认显示
        // 此处可以去掉x轴的文字的显示
        show: false,
        // rotate: 45,
      },
      splitLine: {
        show: false, // 是否显示分隔线。默认数值轴显示
      },
    },
    yAxis: {
      type: "category",
      // 从高到低显示
      inverse: true,
      data: barNameList.value,
      axisTick: {
        show: false, // 是否显示坐标轴刻度 默认显示
      },
      axisLine: {
        // 是否显示坐标轴轴线 默认显示
        show: false, // 是否显示坐标轴轴线 默认显示
        lineStyle: {
          // 坐标轴线线的颜色
          color: "#747393",
        },
      },
      splitLine: {
        show: false, // 是否显示分隔线。默认数值轴显示
      },
      // 坐标轴刻度标签
      axisLabel: {
        show: true, // 是否显示刻度标签 默认显示
        fontSize: 12, // 文字的字体大小
        color: "#747393", // 刻度标签文字的颜色
        width: 50,
        overflow: "truncate", // 文字超出是否显示省略号，默认为true
      },
    },
    color: colorList,
    series: [
      {
        type: "bar",
        barwidth: 10,
        barMaxWidth: 30,
        data: barData.value,
        label: {
          // 是否显示标签 默认显示
          show: true,
          position: "right",
          color: "#747393",
          fontSize: 12,
          formatter: "{c}",
        },
      },
    ],
  },
});

const initBarChart = () => {
  currentBarDataAll.value = props.data;
  getBarData(currentBarDataAll.value);
};

const chooseBarTime = () => {
  let res = currentBarDataAll.value;
  getBarData(res);
};

const getBarData = (res) => {
  if (!res.length) {
    return;
  }
  switch (barTimeFive.value) {
    case "day":
      let data0 = res[0].countResults;
      calculateBarData(data0);
      break;
    case "week":
      let data1 = res[1].countResults;
      calculateBarData(data1);
      break;
    case "month":
      let data2 = res[2].countResults;
      calculateBarData(data2);
      break;
    case "season":
      let data3 = res[3].countResults;
      calculateBarData(data3);
      break;
    case "year":
      let data4 = res[4].countResults;
      calculateBarData(data4);
      break;
    default:
      barData.value = [];
      barNameList.value = [];
  }
};

// 根据后端返回的数据结构 去组装 柱状图 需要的数据
const calculateBarData = (arr) => {
  if (arr.length) {
    barData.value = [];
    barNameList.value = [];
    arr.map((item, index) => {
      barData.value.push(item.countNumber);
      barNameList.value.push(item.algorithmName);
    });
  } else {
    barData.value = [];
    barNameList.value = [];
  }
  // 初始化柱状图
  state.barOption.series[0].data = barData.value;
  state.barOption.yAxis.data = barNameList.value;
  // 清空上次画的图
  myBarChart.clear();
  myBarChart.setOption(state.barOption);
};

const resizeBar = () => {
  myBarChart.clear();
  myBarChart.setOption(state.barOption, true);
  myBarChart.resize();
};

onMounted(() => {

  // 初始化柱状图
  myBarChart = echarts.init(echartBarRef.value);
  window.addEventListener("resize", resizeBar);
  // myBarChart.setOption(state.barOption, true);

  initBarChart();
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeBar);
});
</script>

<style scoped>
/* 1920*1080及其他 */
:deep(.el-select) {
  width: 106px !important;
  margin-right: 5px !important;
}
.main-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bar-chart-content {
  position: relative;
  width: 100%;
  height: calc(100% - 50px);
}
.bar-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
  min-width: 250px;
}
.show-empty-icon {
  width: 100%;
  height: 100%;
  opacity: 1;
  z-index: 1;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ffffff;
}
.not-show-empty-icon {
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: -1;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ffffff;
}
.p5 {
  padding: 5px;
}
.each-title {
  padding: 8px 0 8px 0;
  font-size: 16px;
  color: #414068;
  font-weight: 800;
}
.svg-icon {
  width: 100%;
  height: 90%;
}

.empty-info-data {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100% - 40px);
}

/* 1366x768 */
@media (max-width: 1366px) {
  .each-title {
    font-size: 14px;
  }
  .empty-info-data {
    height: calc(100% - 80px);
  }
}

/* 1440x900 */
@media (min-width: 1367px) and (max-width: 1440px) {
  .each-title {
    font-size: 14px;
  }
  .empty-info-data {
    height: calc(100% - 80px);
  }
}
</style>
