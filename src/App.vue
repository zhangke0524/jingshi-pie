<template>
  <div class="main-content-zk">
    <div class="list-item">
      <pie-chart :data="res.data" :title="'饼图'" />
    </div>
    <div class="list-item">
      <bar-chart :data="barRes.data" :title="'柱状图oo'" />
    </div>
  </div>
  <img :src="test" style="width: 500px; height: 300px; object-fit: contain; background-color: grey;" />
  <el-button @click="showImgAnnotate">显示</el-button>
  <img-label
    :isShowImgAnnotate="isShowImgAnnotate"
    @closeImgAnnotate="closeImgAnnotate"
    :imgUrl="url"
    :groupData="groupData"
    :lastRadio="lastRadio"
    :serviceName="serviceName"
    :hasIndoorRois="hasIndoorRois"
    :incorrectAlarmLocations="incorrectAlarmLocations"
    id="algorithmConfigImgAnnotate"
    ref="refImgAnnotate"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import pieChart from "./components/pieChart.vue";
import { res } from "./utils/mockPieData";
import barChart from "./components/barChart.vue";
import { res as barRes } from "./utils/mockBarData";
import { renderImgWithData } from "./utils/renderImgWithData";
import imgLabel from "./components/imgLabel/index.vue";

const url =
  "http://e.hiphotos.baidu.com/image/pic/item/a1ec08fa513d2697e542494057fbb2fb4316d81e.jpg";
const points =
  "[[10,10,290,290], [30,30,200,30,200,200,30,200]]";
const serviceName = "ppcount";
const algorithmName = "安全通道占用";
const cNum = 1;
const max = 10;
const min = 5;

let test = ref("");
let isShowImgAnnotate = ref(false);
const showImgAnnotate = () => {
  isShowImgAnnotate.value = true;
};
const closeImgAnnotate = () => {
  isShowImgAnnotate.value = false;
};
const groupData = {
  polyLines: [
    [870, 282, 930, 298, 904, 440, 842, 425],
    [1, 4, 1409, 4, 1409, 793, 3, 793],
  ],
  borderLine: [],
  shieldRegions: [],
  indoorRois: [],
};
const lastRadio = 0.90794;
// const serviceName = "detectopen";
// const currentAlgorithmDetail = {
//   id: 4952,
//   lockVersion: null,
//   createTime: 1744184011000,
//   creator: null,
//   creatorName: null,
//   lastUpdateTime: 1744184017000,
//   lastUpdater: null,
//   lastUpdaterName: null,
//   remark: null,
//   algorithmId: 341,
//   deviceChannelId: null,
//   channelId: "34020000001320000314",
//   channelName: null,
//   deviceId: "34020000001320000314",
//   frameExtractionRate: 10,
//   algorithmName: null,
//   threshold: 0.7,
//   serviceName: "detectopen",
//   param: null,
//   polyLines: [
//     [870, 282, 930, 298, 904, 440, 842, 425],
//     [1, 4, 1409, 4, 1409, 793, 3, 793],
//   ],
//   borderLine: [],
//   shieldRegions: [],
//   status: true,
//   detectArea: true,
//   reason: "",
//   imageZoomRatio: "0.90794",
//   image: null,
//   polyLinesList: [
//     [870, 282, 930, 298, 904, 440, 842, 425],
//     [1, 4, 1409, 4, 1409, 793, 3, 793],
//   ],
//   borderLineList: [],
//   shieldRegionsList: [],
//   fileName: "/snapshot/20250409/34020000001320000314-34020000001320000314.jpg",
//   timeThres: null,
//   voteOrNot: false,
//   voteBatchSize: null,
//   voteHitRate: null,
//   resultDeduplication: false,
//   deduplicationRate: null,
//   childModelBizType: null,
//   analysisType: null,
//   peopleCountMinValue: null,
//   peopleCountMaxValue: null,
//   extendedFieldParams: null,
//   drawTips: null,
//   indoorRois: [],
//   indoorRoiList: [],
//   incorrectAlarmLocations: [],
//   locationArea: null,
//   taskStatus: false,
//   channelAlarmFrequency: 1,
// };
const hasIndoorRois = ref(false);
const incorrectAlarmLocations = ref([]);

onMounted(() => {
  renderImgWithData(url, points, algorithmName, serviceName, cNum, min, max)
    .then((res) => {
      test.value = res;
    })
    .catch(() => {
      console.log("error=======");
    });
});
</script>

<style scoped>
.main-content-zk {
  display: flex;
  gap: 20px;
  justify-content: flex-start;
}
.list-item {
  width: 50%;
  flex: 1;
  height: 100%;
  background-color: #fff;
  border: 1px solid #ddd8d8;
  border-radius: 5px;
}
</style>
