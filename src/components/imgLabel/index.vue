<template>
  <el-drawer
    :model-value="props.isShowImgAnnotate"
    :show-close="false"
    size="100%"
    :destroy-on-close="false"
    :close-on-press-escape="false"
  >
    <template #header="{ titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass">
        <!-- <AppTitle :title="'区域标注'"></AppTitle> -->
      </h4>
      <div class="explain-text">{{ explianText }}</div>
      <el-button :disabled="confirmLoading" @click="closeModal" class="w-180"
        >取消</el-button
      >
      <el-button
        :loading="confirmLoading"
        @click="submit"
        type="primary"
        class="w-180"
        >完成标注</el-button
      >
    </template>
    <div class="relative pt-10">
      <div
        class="absolute main-content"
      ></div>
      <div class="flex img-content">
        <div class="flex-1 img-content-left">
          <div class="flex-1 h-40 pt-8 flex">
            <div class="som-tips">
              1、选择绘图工具； 2、在画布上使用鼠标左键确定标注起点；
              3、在画布上使用右键结束标注；
              提示：每种标注区域最多只能标注30个点位
            </div>
            <div class="flex-1 text-right">
              <span v-for="tool in annotateTools" :key="`tools_${tool.value}`">
                <el-tooltip
                  class="box-item"
                  effect="dark"
                  :content="tool.label"
                  placement="bottom"
                >
                  <el-button
                    v-show="
                      hasIndoorRois ||
                      (!hasIndoorRois && tool.value !== 'indoorRois')
                    "
                    @click="toolClick(tool.value)"
                    type=""
                    text
                    class="mr-2"
                    :style="`${
                      activeTool === tool.value
                        ? 'color:#fff;background-color:#700efa'
                        : ''
                    }`"
                  >
                    <SvgIcon :name="tool.icon" />
                  </el-button>
                </el-tooltip>
              </span>
            </div>
          </div>
          <!-- 图片标注区域 -->
          <div
            class="annotate-area h-[calc(100vh-160px)] bg-[#f1f1f1] mt-2 min-h-[500px]"
            :id="selector"
            ref="annotateRef"
          ></div>
        </div>
        <div
          class="w-[1px] h-[calc(100vh-110px)] border-0 border-r-[1px] border-solid border-[#ecf0f4] ml-2"
        ></div>
        <div class="min-w-[200px] p-2 w-[15%] max-h-[calc(100vh-110px)]">
          <div v-if="!currentGroups.length" class="w-full text-center pt-20">
            <el-empty :description="'暂无数据'" />
          </div>
          <div
            v-else
            class="list-wrap max-h-[calc(100vh-150px)] overflow-y-scroll w-full"
          >
            <template v-for="(item, index) in labelObj" :key="`label_${index}`">
              <div
                v-if="
                  currentGroups.filter((g) => g.name === `${item.name}group`)
                    .length
                "
                class=""
              >
                <h5>
                  {{ item.label }}:
                  {{
                    `(${
                      currentGroups.filter(
                        (g) => g.name === `${item.name}group`
                      ).length
                    }条)`
                  }}
                </h5>
                <div
                  v-for="(group, idx) in currentGroups.filter(
                    (g) => g.name === `${item.name}group`
                  )"
                  :key="`group_${group.name}_${idx}`"
                  class="flex text-sm leading-6 text-[#555] hover:font-bold"
                >
                  <span>{{ idx + 1 }}、</span>
                  <span class="flex-1">{{ group.label }}</span>
                  <span class="pt-[1px]">
                    <el-icon
                      class="cursor-pointer"
                      title="删除"
                      @click="groupDelHandler(group)"
                      ><Delete
                    /></el-icon>
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  reactive,
  onUnmounted,
  nextTick,
  watch,
  computed,
} from "vue";
import AppTitle from "@/components/AppTitle/index.vue";
import ImgAnnotate, { annotateTools, labelObj } from "./Label";
import Bus from "@/utils/bus";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { dayjs } from "element-plus";
import { Delete } from "@element-plus/icons-vue";

const props = defineProps({
  isShowImgAnnotate: {
    type: Boolean,
    default: false,
  },
  imgUrl: {
    type: String,
  },
  groupData: {
    type: Object,
  },
  lastRadio: {
    type: Number,
    default: 1,
  },
  currentDetailData: {
    type: Object,
  },
  // 是否有厂区内这第4个工具栏，默认从视频中心/算法管理进入，有厂区内这个工具栏
  // 从离线识图进入，没有厂区内这个工具栏
  // 从轮询任务的参数配置进入、也没有厂区内这个工具栏
  hasIndoorRois: {
    type: Boolean,
    default: true,
  },
  // 误报屏蔽区域的数据
  incorrectAlarmLocations: {
    type: Array,
    default: () => [],
  },
});

const explianText = computed(() => {
  switch (props.currentDetailData?.serviceName) {
    case "detectoccupy":
      return "请在图中标注【未被占用的安全通道】所在区域！";
    case "chl":
      return "请在图中标注【待检测车辆滞留】所在区域！";
    case "detectopen":
      return "请在图中标注【处于关闭状态的门窗】所在区域！";
    default:
      return "";
  }
});

const eventList = ["Add", "Delete"];
const tools = ref([...annotateTools]);
const annotate = ref({});

const emit = defineEmits();
const confirmLoading = ref(false);
const activeTool = ref("move");
const selector = ref("annotate");
const annotateRef = ref(null);

const currentGroups = ref([]);

let nowRadio = ref(null);
let radio1 = ref(null);
let renderImgWidth = ref(0);
let renderImgHeight = ref(0);
// 获取图片的宽高
const getImage = (img) => {
  const imageObj = new Image();
  imageObj.onload = function (e) {
    const canvasWidth = annotateRef.value.clientWidth;
    const canvasHeight = annotateRef.value.clientHeight;
    // 整个画布，包括空白区域所在的地方
    // //console.log(('canvasWidth, canvasHeight', canvasWidth, canvasHeight)
    const { width, height } = e.target;
    const wScale = width / canvasWidth;
    const hScale = height / canvasHeight;
    // 实际图片所在的地方，仅指图片所在的地方
    let imgAreaWidth =
      wScale > hScale ? canvasWidth : width / (height / canvasHeight);
    let imgAreaHeight =
      wScale > hScale ? height / (width / canvasWidth) : canvasHeight;
    renderImgWidth.value = imgAreaWidth;
    renderImgHeight.value = imgAreaHeight;
    //console.log(('xxxxxxxxxxx', imgAreaWidth, imgAreaHeight, width, height);
    // xxxxxxxxxxx 1367.1111111111113 769 1920 1080
    radio1.value = (width / imgAreaWidth).toFixed(5);
    //console.log(('radio1.value', radio1.value);
    //console.log(('lastRadio', props.lastRadio);
    // group的每个坐标都应乘以这个比率 -- to do
    nowRadio.value = (props.lastRadio / radio1.value).toFixed(5);
    // console.log('getImage - props.lastRadio', props.lastRadio);
    // console.log('getImage - radio1.value', radio1.value);
    // console.log('getImage - nowRadio.value', nowRadio.value);

    // 在确定拿到图片的宽高之后，再去初始化
    // 通过图片缩放比例，处理group的坐标
    computeGroupData();
  };
  imageObj.src = new URL(img, import.meta.url).href;
};

const newData = computed(() => {
  return JSON.stringify(props.groupData);
});

const newImg = computed(() => {
  return JSON.stringify(props.imgUrl);
});

watch(
  () => props.hasIndoorRois,
  (val) => {
    if (!val) {
      tools.value = annotateTools.filter((t) => t.value !== "indoorRois");
    }
  },
  {
    immediate: true,
  }
);

let imgRealWidth = 1920;
let imgRealHeight = 1080;

const initGroupData = ref(null);
let isClickedCancleBtn = ref(false);
let lastOperation = ref("");
const closeModal = () => {
  // 点击取消时，需要先判断是否有正在绘制的图形，如果有，则禁用取消按钮，并提示用户先结束绘制
  // 如果没有，则直接关闭弹窗
  if (annotate.value && annotate.value.drawing) {
    ElMessage.warning("请先结束绘制，再点击取消！");
    return;
  }
  lastOperation.value = "cancel";
  isClickedCancleBtn.value = true;
  // 此处用于点击取消后，再次进来时，重置为接口返回时的回显数据
  cacheParams.value = initGroupData.value;
  //console.log(('点击取消时cacheParams', cacheParams.value);
  //console.log(('点击取消时radio', nowRadio.value);
  //console.log(('点击取消时lastRadio', props.lastRadio);
  //console.log(('点击取消时radio1', radio1.value);
  // const {widthRadio, heightRadio} = getImgZoom()
  // emit('closeImgAnnotate', false, null, widthRadio, heightRadio);
  // 点击取消时，不需要再次计算缩放比例，直接使用本来传进来的缩放比例即可
  emit("closeImgAnnotate", false, null, props.lastRadio, props.lastRadio);
};

let isClickedFinishDrawBtn = ref(false);
// 取消-cancel  完成标注-finish
// 每次点开真正的图片绘制页面时，才触发，此处是为了重新绘制，因为删除掉图形数据时，右侧的标注可能排序不连贯了，所以需要重新绘制
// 且第一次不触发（没有immediate:true），第一次依靠init触发
watch(
  () => props.isShowImgAnnotate,
  (val) => {
    if (!val) {
      return;
    }
    // 点开真正的图片绘制页面，判断是否有图片，有图片则初始化
    if (
      props.imgUrl &&
      annotate.value.setData &&
      cacheParams.value &&
      Object.keys(cacheParams.value).length !== 0
    ) {
      // //console.log(('每次点开真正的图片绘制页面时，才触发， cacheParams.value', cacheParams.value)
      // 每次打开弹窗的时候，计算一遍图片的缩放比例(init的时候已经拿到过了)
      // getImage(props.imgUrl)
      currentGroups.value = [];
      //console.log(('watch-props.isShowImgAnnotate', cacheParams.value);
      setTimeout(() => {
        let data = JSON.parse(JSON.stringify(cacheParams.value));
        // 点击【取消】之后再进来时，取消的数据已经在closeModal中处理过了，此处不需要再处理
        if (lastOperation.value === "cancel") {
          //console.log(('啥也不干');
          //console.log(('点进来之后直接点取消，此时应该根本触发不到这里，这句话不会显示');
        } else if (!isClickedFinishDrawBtn.value) {
          // 上次操作是完成标注，且是第一次点击完成标注，此时需要处理数据
          // 仅需要在第一次点击【完成标注】时进行处理，后续不需要处理
          let a = JSON.parse(JSON.stringify(cacheParams.value));
          //console.log(('dealGroupDataByRadio --- watch');
          data = dealGroupDataByRadio(a);
        }
        annotate.value.setData(data, JSON.parse(JSON.stringify(props.imgUrl)));
        // 重置当前选中的工具栏
        activeTool.value = tools.value[0].value;
      }, 0);
    }
  }
);

// 供父组件调用
const resetData = () => {
  cacheParams.value = null;
};

let cacheParams = ref(null);

// 获取图片的缩放比例，供后端和算法使用
const getImgZoom = () => {
  let widthRadio = 1;
  let heightRadio = 1;
  if (annotate.value && annotate.value.getImgAreaSize) {
    let { imgAreaWidth, imgAreaHeight, imgRealWidth, imgRealHeight } =
      annotate.value.getImgAreaSize();
    widthRadio =
      imgRealWidth && imgAreaWidth
        ? (imgRealWidth / imgAreaWidth).toFixed(5)
        : 1;
    heightRadio =
      imgRealHeight && imgAreaHeight
        ? (imgRealHeight / imgAreaHeight).toFixed(5)
        : 1;
  }
  return { widthRadio, heightRadio };
};

// 点击完成标注
const submit = () => {
  // 点击完成标注时，需要先判断是否有正在绘制的图形，如果有，则禁用完成标注按钮，并提示用户先结束绘制
  // 如果没有，则直接关闭弹窗
  if (annotate.value && annotate.value.drawing) {
    ElMessage.warning("请先结束绘制，再点击完成标注！");
    return;
  }
  isClickedFinishDrawBtn.value = true;
  lastOperation.value = "finish";
  confirmLoading.value = true;
  // 此处需手动调用getData，去获取一把最新的数据
  annotate.value.getData();
  const params = annotate.value.getAnnotateData();
  if (params) {
    cacheParams.value = params;
    //console.log(('点击完成标注时cacheParams', cacheParams.value);
    //console.log(('点击完成标注时radio', nowRadio.value);
  }
  setTimeout(() => {
    const { widthRadio, heightRadio } = getImgZoom();
    // handleParams 处理params，将其中的误报屏蔽区过滤出来，组合成一个数组，然后传给父组件
    let incorrect = toSetIncorrectData(params, widthRadio);
    params.incorrectAlarmLocations = incorrect;
    emit("closeImgAnnotate", false, params, widthRadio, heightRadio);
    // console.log('点击完成标注时的数据', params);
    confirmLoading.value = false;
  }, 0);
};

const toSetIncorrectData = (p, widthRadio: string | number) => {
  let keys = Object.keys(p);
  let temp = JSON.parse(JSON.stringify(props.incorrectAlarmLocations));
  keys.forEach((item) => {
    if (item.includes("shieldRegions")) {
      let id = item.replace("shieldRegions", "");
      let current = temp.find((i) => i.id == id);
      if (current) {
        current.shieldRegions = JSON.stringify(p[item]);
        current.imageZoomRatio = String(widthRadio);
      }
    }
  });
  console.log("toSetIncorrectData", temp);
  return temp;
};

const toolClick = (tool) => {
  activeTool.value = tool;
  annotate.value.clearData();
  annotate.value.setCurrentTool(tool);
};

// 供父组件调用
const clearData = () => {
  nextTick(() => {
    annotate.value &&
      annotate.value.clearGroupData &&
      annotate.value.clearGroupData();
  });
};

// init在不刷新页面的情况下，只能触发一次
watch(
  () => annotateRef.value,
  (val) => {
    // console.log('watch-------annotateRef.value')
    // console.log('watch-----labelObj', labelObj)
    // console.log('watch-----tools.value', tools.value)
    // console.log('watch-----toolsList')
    if (val && !annotate.value.getAnnotateData && props.imgUrl) {
      //console.log(('init仅会在重新打开【算法配置】弹框时触发');
      init();
      val.oncontextmenu = function (e) {
        console.log("oncontextmenu右键菜单");
        // return false;
        // 不展示右键菜单，但要触发右键事件
        e.preventDefault();
      };
      // 重置当前选中的工具栏
      activeTool.value = tools.value[0].value;
    } else {
      // to do 移除事件
    }
  }
);

// 最外层使用v-if销毁以后，此处的watch不会再触发了，无效
watch([newData, newImg, annotate.value], (val, oldVal) => {
  // //console.log((val[0] === oldVal[0], val[0], oldVal[0]);
  if (
    (val[0] !== oldVal[0] || val[1] !== oldVal[1]) &&
    annotate.value.setData
  ) {
    //console.log(('watch - newData, newImg, annotate.value', JSON.parse(val[0]));
    currentGroups.value = [];
    setTimeout(() => {
      let a = JSON.parse(val[0]);
      //console.log(('dealGroupDataByRadio --- watch --- v-if -- 不应被触发');
      let b = dealGroupDataByRadio(a);
      annotate.value.setData(b, JSON.parse(val[1]));
    }, 0);
  }
});

const dealGroupDataByRadio = (obj) => {
  /* arr的形式是如下，最外层是对象，内层是数组，且是二维数组，现在需要遍历每个数组，然后乘以nowRadio
    {
      borderLine: [],
      polyLines: [[2, 3, 1407, 5, 1411, 790]]
      shieldRegions: []
    }
    */
  // 1、先从对象中取出每个key及其对应的value
  // 2、然后遍历value，乘以nowRadio
  //console.log(('dealGroupDataByRadio - obj', obj);
  let objData = JSON.parse(JSON.stringify(obj));
  let keys = Object.keys(objData);
  //console.log(('dealGroupDataByRadio - nowRadio.value', nowRadio.value);
  //console.log(('dealGroupDataByRadio - nextTick -- nowRadio.value', nowRadio.value);
  keys.forEach((item) => {
    if (objData[item].length > 0) {
      objData[item].forEach((itemA, indexA) => {
        itemA.forEach((itemB, indexB) => {
          // 如果计算出来的坐标大于渲染出来的图片的宽度或者高度，则将此点坐标限制为图片的宽度或者高度
          // 注意：还要区分是x坐标还是y坐标：从indexB的值来看，第偶数个点（0、2、4）是x坐标，第奇数个点（1、3、5）是y坐标
          if (
            indexB % 2 === 0 &&
            !!renderImgWidth.value &&
            itemB * nowRadio.value > renderImgWidth.value
          ) {
            objData[item][indexA][indexB] = renderImgWidth.value;
          } else if (
            indexB % 2 === 1 &&
            !!renderImgHeight.value &&
            itemB * nowRadio.value > renderImgHeight.value
          ) {
            objData[item][indexA][indexB] = renderImgHeight.value;
          } else {
            objData[item][indexA][indexB] = itemB * nowRadio.value;
          }
        });
      });
    }
  });
  console.log("objData", objData);
  return objData;
};

/**
 *初始化
 */
const init = () => {
  // const { clientWidth, clientHeight } = annotateRef.value;
  const img = JSON.parse(newImg.value);

  getImage(img);

  // const cb = (type, msg) => {
  //   switch (type) {
  //     case 'success':
  //     case 'warning':
  //       ElMessage[type](msg);
  //       break;
  //   }
  // };
  // setTimeout(() => {
  //   let a = JSON.parse(JSON.stringify(props.groupData))
  //   let b = dealGroupDataByRadio(a)
  //   const _data = b ? b : a
  //   initGroupData.value = _data
  //   //console.log(('init - props.groupData', props.groupData)
  //   //console.log(('init - initGroupData', _data)
  //   annotate.value = new ImgAnnotate({ width: clientWidth, height: clientHeight, img, el: selector.value, container: annotateRef, initData: _data, cb, getEmitList });
  //   activeTool.value = tools.value[0].value;
  //   annotate.value.clearData();
  //   annotate.value.setCurrentTool(activeTool.value);
  // }, 0)
};

const computeGroupData = () => {
  const { clientWidth, clientHeight } = annotateRef.value;
  const img = JSON.parse(newImg.value);
  const cb = (type, msg) => {
    switch (type) {
      case "success":
      case "warning":
        ElMessage[type](msg);
        break;
    }
  };

  let a = JSON.parse(JSON.stringify(props.groupData));
  handleIncorrectAlarmLocations();
  //console.log(('dealGroupDataByRadio -- init -- computeGroupData');
  // 拼接误报屏蔽区域的数据
  // incorrectDatas.value.forEach((item) => {
  //   a[`shieldRegions${item.id}`] = item.shieldRegions;
  // });
  let b = dealGroupDataByRadio(a);
  // 拼接误报屏蔽区与的数据
  incorrectDatas.value.forEach((item) => {
    b[`shieldRegions${item.id}`] = item.shieldRegions;
  });
  const _data = b ? b : a;
  initGroupData.value = _data;
  //console.log(('init - props.groupData', props.groupData);
  //console.log(('init - initGroupData', _data);
  annotate.value = new ImgAnnotate({
    width: clientWidth,
    height: clientHeight,
    img,
    el: selector.value,
    container: annotateRef,
    initData: _data,
    cb,
    getEmitList,
  });
  activeTool.value = tools.value[0].value;
  annotate.value.clearData();
  annotate.value.setCurrentTool(activeTool.value);
  // 改变labelObj的值和toolList的值
  annotate.value.setLabelObj(newLabelObj.value);
  annotate.value.setToolsList(newToolList.value);
};

// 处理错误的屏蔽区域数据
let incorrectDatas = ref([]);
let newLabelObj = ref([]);
let newToolList = ref([]);
let newTools = ref([]);
const handleIncorrectAlarmLocations = () => {
  console.log("handleIncorrectAlarmLocations--------start");
  console.log("incorrectDatas", incorrectDatas.value);
  console.log("newLabelObj", newLabelObj.value);
  console.log("newToolList", newToolList.value);
  console.log("newTools", newTools.value);

  // 清空数据，防止重复添加
  incorrectDatas.value = [];
  newLabelObj.value = [];
  newToolList.value = [];
  newTools.value = [];

  if (!props.incorrectAlarmLocations?.length) {
    return;
  }
  // TO DO 如后续需要计算每个误报屏蔽区域的坐标，在此处进行处理即可
  props.incorrectAlarmLocations.forEach((item) => {
    if (item.shieldRegions) {
      let val = JSON.parse(item.shieldRegions);
      let temp = JSON.parse(JSON.stringify(val));
      if (val?.length && item.imageZoomRatio) {
        let eachRadio = (item.imageZoomRatio / radio1.value).toFixed(5);
        temp.forEach((itemA, indexA) => {
          itemA.forEach((itemB, indexB) => {
            // temp[indexA][indexB] = itemB * eachRadio
            // 如果计算出来的坐标大于渲染出来的图片的宽度或者高度，则将此点坐标限制为图片的宽度或者高度
            // 注意：还要区分是x坐标还是y坐标：从indexB的值来看，第偶数个点（0、2、4）是x坐标，第奇数个点（1、3、5）是y坐标
            if (
              indexB % 2 === 0 &&
              !!renderImgWidth.value &&
              itemB * eachRadio > renderImgWidth.value
            ) {
              temp[indexA][indexB] = renderImgWidth.value;
            } else if (
              indexB % 2 === 1 &&
              !!renderImgHeight.value &&
              itemB * eachRadio > renderImgHeight.value
            ) {
              temp[indexA][indexB] = renderImgHeight.value;
            } else {
              temp[indexA][indexB] = itemB * eachRadio;
            }
          });
        });
      }
      let current = Object.assign({}, item, { shieldRegions: temp });
      incorrectDatas.value.push(current);
      // let timeStr = dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss');
      // 仅保留月、日、时 即可
      let timeStr = dayjs(item.createTime).format("MMDDHH");
      let cLabelObj = {
        id: item.id,
        label: `误报屏蔽区#${timeStr} - ${item.id}`,
        name: `shieldRegions${item.id}`,
        type: "shieldRegions",
      };
      newLabelObj.value.push(cLabelObj);
      let cTool = {
        id: item.id,
        name: `shieldRegions${item.id}`,
        type: "poly",
        color: "#FFFF00",
        lineColor: "#FFFF00 ",
        anchorColor: "#FFD600",
        label: `误报屏蔽区#${timeStr} - ${item.id} - `,
      };
      newToolList.value.push(cTool);
      let cTools = {
        label: `误报屏蔽区===${item.id}`,
        value: `shieldRegions${item.id}`,
        icon: "region",
        isFunc: true,
      };
      newTools.value.push(cTools);
    }
  });
  console.log("incorrectDatas", incorrectDatas.value);
  tools.value = [...tools.value, ...newTools.value];
  addRemoveEvents(true);
};

const resizeWin = () => {
  nextTick(() => {
    annotate.value.resizeCanvas && annotate.value.resizeCanvas();
  });
};

// 对象数组根据某属性去重
const uniqueFunc = (arr, uniqPropName) => {
  const res = new Map();
  return arr.filter(
    (item) => !res.has(item[uniqPropName]) && res.set(item[uniqPropName], 1)
  );
};

const groupAddHandler = (groupData) => {
  // 为了避免绘制后退出，再次进入时，会出现重复的情况，对其进行去重
  let tempData = [...currentGroups.value, groupData];
  currentGroups.value = uniqueFunc(tempData, "label");
};

const groupDeleteHandler = (groupData) => {
  //console.log(('删除时的group', groupData);
  const _currentGroups = [...currentGroups.value];
  const index = currentGroups.value.findIndex((c) => c.id === groupData.id);
  annotate.value.deleteGroup(groupData);
  _currentGroups.splice(index, 1);
  currentGroups.value = [..._currentGroups];
};

const getEmitList = () => {
  const obj = {};
  tools.value
    .filter((t) => t.isFunc)
    .forEach((tool) => {
      eventList.forEach((eventName) => {
        const eName = `${tool.value}group${eventName}`;
        obj[eName] = (group) => {
          Bus.$emit(eName, group);
        };
      });
    });
  return obj;
};

const groupDelHandler = (groupData) => {
  const _currentGroups = [...currentGroups.value];
  const index = currentGroups.value.findIndex((c) => c.id === groupData.id);
  annotate.value.deleteGroup(groupData);
  _currentGroups.splice(index, 1);
  currentGroups.value = [..._currentGroups];
};

const addRemoveEvents = (isAdd) => {
  tools.value
    .filter((t) => t.isFunc)
    .forEach((tool) => {
      eventList.forEach((eventName) => {
        const eName = `${tool.value}group${eventName}`;
        switch (eventName) {
          case "Add":
            isAdd
              ? Bus.$on(eName, groupAddHandler)
              : Bus.$off(eName, groupAddHandler);
            break;
          case "Delete":
            isAdd
              ? Bus.$on(eName, groupDeleteHandler)
              : Bus.$off(eName, groupDeleteHandler);
            break;
        }
      });
    });
};

addRemoveEvents(true);

defineExpose({
  resetData,
  clearData,
});

onMounted(() => {
  console.log(props.currentDetailData);
  nextTick(() => {
    // init();
    window.addEventListener("resize", resizeWin);
  });
  // document.oncontextmenu = function () {
  //   return false;
  // };
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeWin);
  // 恢复画布自己的labelObj和toolsList
  annotate.value.setLabelObj && annotate.value.setLabelObj();
  annotate.value.setToolsList && annotate.value.setToolsList();
  tools.value = annotateTools;

  annotate.value.destroy && annotate.value.destroy();
  addRemoveEvents();
});
</script>

<style scoped>
.list-wrap::-webkit-scrollbar {
  width: 1px;
  height: 1px;
}
.absolute {
  position: absolute;
}
.relative {
  position: relative;
}
.pt-10 {
  padding-top: 10px;
}
.w-180 {
  width: 180px;
}
.flex {
  display: flex;
}
.flex-1 {
  flex: 1;
}
.h-40 {
  height: 40px;
}
.pt-8 {
  padding-top: 8px;
}
.img-content {
  margin-top: -30px;
}
.some-tips {
  text-align: left;
  padding-left: 8px;
  height: 40px;
  padding-top: 8px;
  color: #666;
}
.explain-text {
  position: absolute;
  top: 57px;
  left: 36px;
  font-size: 12px;
  color: red;
}
/* -top-[20px] -left-0 -right-0 border-0 border-t-[1px] border-solid border-[#ecf0f4] w-full */
.main-content {
  top: -20px;
  left: 0;
  right: 0;
  border: 0;
  border-top: 1px solid #ecf0f4;
  width: 100%;
}
.img-content-left {
  max-width: 85%;
  min-width: 500px;
}
</style>
