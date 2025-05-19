<template>
  <div class="main-content-zk">
    <div class="list-item">
      <pie-chart :data="res.data" :title="'饼图'" />
    </div>
    <div class="list-item">
      <bar-chart :data="barRes.data" :title="'柱状图oo'" />
    </div>
  </div>
  <img :src="test" style="width: 500px; height: 300px" />
  <el-button @click="showImgAnnotate">显示</el-button>
  <img-label
    :isShowImgAnnotate="isShowImgAnnotate"
    @closeImgAnnotate="closeImgAnnotate"
    :imgUrl="url"
    :groupData="groupData"
    :lastRadio="lastRadio"
    :currentDetailData="currentAlgorithmDetail"
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
  "http://10.15.11.26:9000/detection/frame/20250423/10/34020000001110000003/34020000001320000023/20250423104548161-0868deb4.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=admin%2F20250519%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250519T025925Z&X-Amz-Expires=1800&X-Amz-SignedHeaders=host&X-Amz-Signature=43b7f3c2f8028ece11f41fc1a02af9e41ddd3c9ba1c4af1953472bf728baf54a";
const points =
  "[[1047.0,299.0,1244.0,598.0],[1170.0,138.0,1265.0,259.0],[887.0,385.0,978.0,523.0]]";
const serviceName = "ppcount";
const algorithmName = "人数异常检测";
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
const currentAlgorithmDetail = {
  id: 4952,
  lockVersion: null,
  createTime: 1744184011000,
  creator: null,
  creatorName: null,
  lastUpdateTime: 1744184017000,
  lastUpdater: null,
  lastUpdaterName: null,
  remark: null,
  algorithmId: 341,
  deviceChannelId: null,
  channelId: "34020000001320000314",
  channelName: null,
  deviceId: "34020000001320000314",
  frameExtractionRate: 10,
  algorithmName: null,
  threshold: 0.7,
  serviceName: "detectopen",
  param: null,
  polyLines: [
    [870, 282, 930, 298, 904, 440, 842, 425],
    [1, 4, 1409, 4, 1409, 793, 3, 793],
  ],
  borderLine: [],
  shieldRegions: [],
  status: true,
  detectArea: true,
  reason: "",
  imageZoomRatio: "0.90794",
  image: null,
  polyLinesList: [
    [870, 282, 930, 298, 904, 440, 842, 425],
    [1, 4, 1409, 4, 1409, 793, 3, 793],
  ],
  borderLineList: [],
  shieldRegionsList: [],
  fileName: "/snapshot/20250409/34020000001320000314-34020000001320000314.jpg",
  timeThres: null,
  voteOrNot: false,
  voteBatchSize: null,
  voteHitRate: null,
  resultDeduplication: false,
  deduplicationRate: null,
  childModelBizType: null,
  analysisType: null,
  peopleCountMinValue: null,
  peopleCountMaxValue: null,
  extendedFieldParams: null,
  drawTips: null,
  indoorRois: [],
  indoorRoiList: [],
  incorrectAlarmLocations: [],
  locationArea: null,
  taskStatus: false,
  channelAlarmFrequency: 1,
};
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
