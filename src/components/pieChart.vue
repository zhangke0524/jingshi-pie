<template>
  <div class="w-full h-full" v-loading="isPieLoading">
    <div class="pie-chart-content">
      <div class="each-title">
        <SvgIcon
          icon-class="app-title"
          name="app-title"
          style="height: 16px; width: 16px"
        />
        <span>{{ props.title }}</span>
      </div>
      <el-select v-model="timeFive" placeholder="请选择" @change="changeTimeFive">
        <el-option
          v-for="item in timeFiveList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div ref="echartPieRef" class="pie-chart-area"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive, computed } from "vue";
// import { GetAlarmStatistics } from '@/api/first-page';
import * as echarts from "echarts";
import { pieColorList } from "@/utils/constants";
// import { useI18n } from 'vue-i18n';
// const { t } = useI18n();

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

const timeFive = ref("day");
// 报警事件统计 - 饼图
let isPieLoading = ref(false);
// 饼图的后端接口返回的全部数据
const currentPieDataAll = ref(null);
const echartPieRef = ref(null);
let myPieChart = ref(null);
const pieData = ref([]);
const state = reactive({
  pieOption: {
    tooltip: {
      trigger: "item",
      appendToBody: true,
    },
    legend: {
      icon: "circle",
      bottom: 0,
      type: "scroll",
    },
    color: colorList,
    series: [
      {
        name: props.title,
        type: "pie",
        radius: ["30%", "50%"],
        avoidLabelOverlap: false,
        center: ["50%", "45%"],
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
          },
        },
        labelLine: {
          show: false,
        },
        data: pieData.value,
      },
    ],
  },
});

const timeFiveList = computed(() => {
  return [
    { value: "day", label: "日" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
    { value: "season", label: "季" },
    { value: "year", label: "年" },
  ];
});

// // 获取报警事件统计数据 -- 饼图
// const getAlarmStatistics = () => {
//   isPieLoading.value = true;
//   GetAlarmStatistics()
//     .then((res) => {
//       currentPieDataAll.value = res.data;
//       getPieData(res.data);
//     })
//     .catch((e) => {
//       //console.log('error--pieeeeeeeee', e)
//     })
//     .finally(() => {
//       isPieLoading.value = false;
//     });
// };

const changeTimeFive = () => {
  let res = currentPieDataAll.value;
  getPieData(res);
};

const getPieData = (res) => {
  switch (timeFive.value) {
    case "day":
      let data0 = res[0].countResults;
      calculatePieData(data0);
      break;
    case "week":
      let data1 = res[1].countResults;
      calculatePieData(data1);
      break;
    case "month":
      let data2 = res[2].countResults;
      calculatePieData(data2);
      break;
    case "season":
      let data3 = res[3].countResults;
      calculatePieData(data3);
      break;
    case "year":
      let data4 = res[4].countResults;
      calculatePieData(data4);
      break;
    default:
      pieData.value = [];
  }
};

// 根据后端返回的数据结构 去组装饼图需要的数据
const calculatePieData = (arr) => {
  if (arr.length) {
    pieData.value = arr.map((item, index) => {
      return Object.assign(
        {},
        { name: item.algorithmName, value: item.countNumber }
      );
    });
  } else {
    pieData.value = [];
  }
  showLegend();
  // 初始化饼图
  state.pieOption.series[0].data = pieData.value;
  myPieChart.setOption(state.pieOption);
};

const resizePie = () => {
  showLegend();
  myPieChart.clear();
  myPieChart.setOption(state.pieOption, true);
  myPieChart.resize();
  //console.log('resizePie')
};

// 将屏幕宽度小于1366，且高度小于617，不展示legend 封装成一个方法
const showLegend = () => {
  if (
    (window.innerWidth <= 1366 && window.innerHeight <= 617) ||
    window.innerWidth <= 1440
  ) {
    // 饼图
    state.pieOption.legend = {
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      bottom: 0,
      type: "scroll",
    };
    state.pieOption.series[0].radius = ["35%", "60%"];
    state.pieOption.series[0].label = {
      show: false,
    };
    state.pieOption.series[0].labelLine = {
      show: false,
    };
    state.pieOption.series[0].emphasis = {
      label: {
        show: false,
      },
    };
  } else {
    // 饼图
    state.pieOption.legend = {
      icon: "circle",
      bottom: 0,
      type: "scroll",
    };
    state.pieOption.series[0].radius = ["30%", "50%"];
    state.pieOption.series[0].label = {
      show: true,
      width: 80,
      overflow: "truncate",
      ellipsis: "...",
    };
    // 视觉引导线
    state.pieOption.series[0].labelLine = {
      show: true,
    };
    state.pieOption.series[0].emphasis = {
      label: {
        show: true,
      },
    };
  }
};

const initData = () => {
  currentPieDataAll.value = props.data;
  // 获取数据并更新图表
  getPieData(currentPieDataAll.value);
}

onMounted(() => {
  // 初始化饼图
  myPieChart = echarts.init(echartPieRef.value);
  // 为饼图添加resize事件
  window.addEventListener("resize", resizePie);
  
  initData()
  
  setTimeout(() => {
    resizePie();
  }, 600);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizePie);
});
</script>

<style scoped>
/* 1920*1080及其他 */
:deep(.el-select) {
  width: 106px !important;
  margin-right: 5px !important;
}
.pie-chart-area {
  width: 100%;
  height: calc(100% - 50px);
  min-width: 200px;
  min-height: 200px;
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
.pie-chart-content {
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.w-full {
  width: 100%;
  background-color: aquamarine;
}
.h-full {
  height: 100%;
}

/* 1366x768 */
@media (max-width: 1366px) {
  .each-title {
    font-size: 14px;
  }
}

/* 1440x900 */
@media (min-width: 1367px) and (max-width: 1440px) {
  :deep(.el-select__tags) {
    width: 110px !important;
  }
  .pie-chart-area {
    width: 100%;
    height: calc(100% - 50px);
  }
  .each-title {
    font-size: 14px;
  }
}
</style>
