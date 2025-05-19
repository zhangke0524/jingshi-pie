import Konva from 'konva';
import { nextTick } from 'vue';

export let labelObj = [
  {
    name: 'polyLines',
    type: 'polyLines',
    label: '多边形检测区',
    id: '00ab1'
  },
  {
    name: 'borderLine',
    type: 'borderLine',
    label: '警示线',
    id: '00ab2'
  },
  {
    name: 'shieldRegions',
    type: 'shieldRegions',
    label: '多边形屏蔽区',
    id: '00ab3'
  },
  {
    name: 'indoorRois',
    type: 'indoorRois',
    label: '厂区内',
    id: '00ab4'
  },
]

const eventSuffix = {
  add: 'groupAdd',
  del: 'groupDelete',
};

export const annotateTools = [
  {
    label: '多边形检测区',
    value: 'polyLines',
    icon: 'area',
    isFunc: true,
  },
  {
    label: '警示线',
    value: 'borderLine',
    icon: 'line',
    isFunc: true,
  },
  {
    label: '多边形屏蔽区',
    value: 'shieldRegions',
    icon: 'region',
    isFunc: true,
  },
  {
    label: '厂区内',
    value: 'indoorRois',
    icon: 'bianjie',
    isFunc: true,
  },
];

export default class ImgAnnotate {
  annotateData = {};
  line = false;
  poly = false;
  canvas = null;
  layer = null;
  shape = null;
  image = { src: null };
  currentTool = '';
  toolsList = [
    {
      name: 'borderLine',
      type: 'line',
      color: '#EA80FC',
      /* 边框颜色 */
      lineColor: '#EA80FC',
      /* 顶点颜色 */
      anchorColor: '#D500F9',
      label: '警示线',
    },
    {
      name: 'polyLines',
      type: 'poly',
      color: '#75fb4c',
      lineColor: '#75fb4c',
      anchorColor: 'green',
      label: '多边形检测区',
    },
    {
      name: 'shieldRegions',
      type: 'poly',
      color: '#FFFF00',
      lineColor: '#FFFF00 ',
      anchorColor: '#FFD600',
      label: '多边形屏蔽区',
    },
    {
      name: 'indoorRois',
      type: 'poly',
      color: '#FF8A65',
      lineColor: '#FF8A65',
      anchorColor: '#FF5722',
      label: '厂区内',
    }
  ];
  drawing = false;
  //初始不能绘画
  currentDrawingShape = null;
  //现在绘画的图形
  linePoints = [];
  //存储线的各个顶点的数据
  polygonPoints = [];
  //存储绘画多边形各个顶点的数组
  canvasWidth = 0;
  //画布宽
  canvasHeight = 0;
  //画布高
  scale = 1;
  //窗口变化的缩放比例
  currentDel = null;
  //删除对象
  currentCancel = null;
  //删除对象
  mouseOffsetX = 0;
  mouseOffsetY = 0;
  mouseOffsetList = [];
  label = '';
  callback = null;
  container = null;
  //标注
  emitList = {};

  constructor({ width, height, img, el, container, initData, cb, getEmitList }) {
    //1实例化canvas层
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.callback = cb || null;
    this.canvas = new Konva.Stage({
      container: el,
      width,
      height,
      ignoreStroke: true,
    });
    this.container = container;
    this.annotateData = initData || {};
    this.emitList = getEmitList ? getEmitList() : {};

    this.group = {
      x: 0,
      y: 0,
    };

    this.canvas.container().style.cursor = 'crosshair';
    //2实例化layer层
    this.layer = new Konva.Layer();
    //3添加layer层
    this.canvas.add(this.layer);

    this.initImage(img);

    this.bindEvents();
  }

  setCurrentTool(currentToolValue) {
    this.currentTool = { ...this.toolsList.find((tool) => tool.name === currentToolValue) };
  }

  setLabelObj(newObjList) {
    if (!newObjList || newObjList.length === 0) {
      // 应只保留前4种通用的label
      labelObj = labelObj.slice(0, 4)
      return;
    }
    labelObj = labelObj.concat(newObjList);
  }
  setToolsList(newToolsList) {
    if (!newToolsList || newToolsList.length === 0) {
      // 应只保留前4种通用的toolList
      this.toolsList = this.toolsList.slice(0, 4)
      return;
    }
    this.toolsList = this.toolsList.concat(newToolsList);
  }

  bindEvents() {
    //鼠标按下
    const _this = this;
    const { canvas, callback } = _this;
    canvas.on('mousedown', (e) => {
      //鼠标左键开始
      const { shape, currentTool, drawing, polygonPoints, linePoints, scale, layer, currentDrawingShape } = _this;
      switch (e.evt.button) {
        case 0:
          // if (e.target === this.canvas) {
          if (e.target.nodeType === 'Stage' && canvas.nodeType === e.target.nodeType) {
            //开始初始绘画
            if (canvas?.attrs?.container?.childNodes[0] === e.target?.attrs?.container?.childNodes[0]) {
              callback && callback('warning', '无图片数据');
              return;
            }
          }
          //图形起始点只能在图片层上
          if (e.target.nodeType === 'Shape' && shape.nodeType === e.target.nodeType) {
            //开始初始绘画
            // 此处暂时去掉：为了“允许第二个图形的起始点就绘在其他图形上”
            // if (shape?.attrs?.image === e.target?.attrs?.image) {
            _this.canvasMousedown(currentTool, e);
            return;
            // }
          }
          //允许后续点绘画在其他图形上
          if (drawing) {
            _this.canvasMousedown(currentTool, e);
            return;
          }
          break;
        case 2:
          console.log('右键触发了')
          if (e.target.nodeType === 'Stage' && canvas.nodeType === e.target.nodeType) {
            //开始初始绘画
            if (canvas?.attrs?.container?.childNodes[0] === e.target?.attrs?.container?.childNodes[0]) {
              callback && callback('warning', '请在图上标注');
              return;
            }
          }
          //最好使用konva提供的鼠标xy点坐标
          const mousePos = canvas.getPointerPosition();
          //考虑鼠标缩放
          const x = (mousePos.x / scale - layer.getAttr('x')) / layer.scaleX();
          const y = (mousePos.y / scale - layer.getAttr('y')) / layer.scaleY();
          if (polygonPoints.length != 0) {
            _this.endDrawPoints(x, y, 'polygonPoints');
            //判断是否是只有两个点的多边形，如果起点和终点相同，不允许绘画
            if (currentDrawingShape.points().length === 2 || currentDrawingShape.points().length === 4) {
              this.drawing = false;
              currentDrawingShape.getParent().destroy();
              _this.polygonPoints = [];
              callback && callback('warning', t('rulesInfo.顶点数必须大于2个！'));
              return;
            }
            _this.showHideLabel(true, true);
            _this.polygonPoints = [];
            _this.emitList[currentTool.name + eventSuffix.add](_this.getGroupData());
            _this.getData();
          }
          if (linePoints.length === 2) {
            _this.endDrawPoints(x, y, 'linePoints');

            _this.showHideLabel(true, true);
            _this.linePoints = [];
            _this.emitList[currentTool.name + eventSuffix.add](_this.getGroupData());
            _this.getData();
          }
          e.cancelBubble = true;
          _this.drawing = false;
          break;
      }
    });

    //鼠标移动
    canvas.on('mousemove', (e) => {
      if (_this.currentTool && _this.drawing) {
        //绘画中
        _this.canvasMousemove(_this.currentTool);
      }
    });
    //鼠标放开
    canvas.on('mouseup', (e) => {
      const { currentTool, drawing, polygonPoints, linePoints } = _this;

      if (e.evt.button === 0) {
        _this.draw = true;
        if (currentTool && drawing) {
          _this.canvasMouseup(currentTool, e);
        }
      } else if (e.evt.button === 2) {
        if (currentTool && !drawing && (polygonPoints.length !== 0 || linePoints.length !== 0)) {
          _this.canvasMouseup(currentTool, e);
        }
      }
    });
    //鼠标滚轮事件
    // canvas.on('wheel', (e) => {
    //   const { canvas, layer, scale, shape, mouseOffsetList } = _this;
    //   if (shape) {
    //     const step = 0.03; // 每次缩放的比例
    //     const mousePos = canvas.getPointerPosition();
    //     const x = mousePos.x / scale;
    //     const y = mousePos.y / scale;
    //     let isChange = false;
    //     if (e.evt.wheelDelta > 0) {
    //       isChange = true;
    //       _this.mouseOffsetX = x * step;
    //       _this.mouseOffsetY = y * step;
    //       // 放大
    //       layer.scaleX(layer.scaleX() + step);
    //       layer.scaleY(layer.scaleY() + step);
    //       layer.move({ x: -_this.mouseOffsetX, y: -_this.mouseOffsetY });
    //       mouseOffsetList.push(...[_this.mouseOffsetX, _this.mouseOffsetY]);
    //     } else if (e.evt.wheelDelta < 0 && mouseOffsetList.length != 0) {
    //       isChange = true;
    //       layer.scaleX(layer.scaleX() - step);
    //       layer.scaleY(layer.scaleY() - step);
    //       _this.mouseOffsetY = _this.mouseOffsetList.pop();
    //       _this.mouseOffsetX = _this.mouseOffsetList.pop();
    //       layer.move({ x: _this.mouseOffsetX, y: _this.mouseOffsetY });
    //     }
    //     if (isChange) {
    //       //维持原来大小
    //       layer.find('Circle').forEach((el) => {
    //         el.setAttr('radius', 5 / scale / layer.scaleX());
    //       });
    //       layer.find('Label').forEach((el) => {
    //         el.getText().setAttrs({
    //           fontSize: _this.getSize(12),
    //           padding: _this.getSize(10),
    //         });
    //       });
    //       canvas.draw();
    //     }
    //   }
    // });
    canvas.on('dragmove', (e) => {
      // const { currentDel } = _this;
      // //console.log(('xxxxcurrentDel', currentDel)
      // let elements = currentDel.getChildren(); // 获取Group中的所有元素
      // let isOutOfBounds = elements.some(function(element) {
      //   let absolutePosition = element.getAbsolutePosition(); // 获取元素在画布上的绝对位置
      //   let minX = 0;
      //   let minY = 0;
      //   let maxX = canvas.width() - element.width();
      //   let maxY = canvas.height() - element.height();
      //   return (
      //     absolutePosition.x < minX || absolutePosition.x > maxX || absolutePosition.y < minY || absolutePosition.y > maxY
      //   );
      // });
      // let previousPosition = currentDel.position()
      // if (isOutOfBounds) {
      //   currentDel.position(previousPosition); // 恢复Group到上一个位置
      // } else {
      //   previousPosition = currentDel.position(); // 更新上一个位置为当前位置
      // }
    });
    // 鼠标拖拽开始
    canvas.on('dragstart', (e, ...arg) => {
      // //console.log(('我在dragstart', e)
      // setTimeout(() => {
      //   //console.log(('e.target.points', e.target.points)
      // }, 500)
      // //console.log(('++', arg)
      // // 1、记住当前这个拖拽对象
      // const { currentDel } = _this;
      // const labelObj = currentDel.getChildren(
      //   (el) => el.getAttr('name').includes('label')
      // );
      // const labelText = labelObj[0].getText().text();
      // // 2、记住这个拖拽对象的所有点的坐标
      // let pointList = []
      // setTimeout(() => {
      //   pointList = e.currentTarget.mouseClickEndShape.attrs.points
      //   //console.log(('111-----setTimeout-----pointList', pointList)
      // }, 500)
      // 坐标获取：e中存在
    });
    // 鼠标拖拽结束
    canvas.on('dragend', (e) => {
      // //console.log(('我在dragend', e)
      // 0、获取当前拖拽对象的坐标
      // 1、遍历此拖拽对象的所有的点的坐标
      // 2、若有任一点的坐标出画布区域，则返回至拖拽时保留的坐标
      // 如何获取画布的坐标
    });
    //快捷键
    const container = canvas.container();
    container.tabIndex = 1;
    container.focus();
    container.addEventListener('keydown', (e) => {
      const { canvas, layer, currentDel, currentTool } = _this;
      //删除的快捷键
      if (e.keyCode === 46 && currentDel) {
        const labelObj = currentDel.getChildren((el) => el.getAttr('name').includes('label'));
        const labelText = labelObj[0].getText().text();
        const delData = {
          id: currentDel._id,
          name: currentDel.getName(),
          label: labelText,
        };
        // 要联动删掉右边的展示列表中的项
        _this.emitList[currentTool.name + eventSuffix.del](delData);
        // 删除掉左边对应图形
        currentDel.destroy();
        _this.currentDel = null;
        callback && callback('success', '删除成功！');
      }
      canvas.container().style.cursor = 'crosshair';
      e.preventDefault();
      layer.draw();
    });

    container.addEventListener('keydown', (e) => {
      //撤销的快捷键(ctrl+z)
      const { canvas, layer, scale, currentTool, drawing, currentCancel, polygonPoints, callback } = _this;
      if (e.ctrlKey === true && e.keyCode === 90) {
        switch (currentTool.type) {
          case 'poly':
            //删除点
            polygonPoints.splice(polygonPoints.length - 2, 2);
            //如果撤销的是第一个点，直接删除group
            if (drawing && polygonPoints.length === 0) {
              currentCancel.destroy();
              _this.drawing = false;
            } //如果是已绘画完的多边形
            else if (!drawing && polygonPoints.length === 0) {
              if (currentCancel) {
                currentCancel.destroy();
                _this.currentCancel = null;
                callback && callback('success', '删除成功！');
              }
            } else {
              currentCancel
                .getChildren((node) => {
                  return node.x() === x && node.y() === y;
                })[0]
                .destroy();
              //重新绘画多边形
              //最好使用konva提供的鼠标xy点坐标
              const mousePos = canvas.getPointerPosition();
              //考虑鼠标缩放
              const x = (mousePos.x / scale - layer.getAttr('x')) / layer.scaleX();
              const y = (mousePos.y / scale - layer.getAttr('y')) / layer.scaleY();
              const tempPoints = polygonPoints.concat();
              tempPoints.push(x);
              tempPoints.push(y);
              //修改多边形的点
              currentCancel.find('.' + currentTool.name + 'poly')[0].setAttr('points', tempPoints);
              //重新绘画多边形的边
              currentCancel.find('.' + currentTool.name + 'line')[0].setAttr('points', tempPoints);
            }
            break;
        }
      }
      canvas.container().style.cursor = 'crosshair';
      e.preventDefault();
      layer.draw();
    });
  }

  endDrawPoints(x, y, pointsName) {
    const { currentDrawingShape, currentTool } = this;
    const points = this[pointsName];
    this.drawCircle(currentTool, x, y, currentDrawingShape.getParent(), points);
    points.push(...[x, y]);
    //绘画多边形
    currentDrawingShape.setAttr('points', points);
    //group继续添加多边形的边
    currentDrawingShape
      .getParent()
      .getChildren((node) => {
        return node.getAttr('name') === currentTool.name + 'line';
      })[0]
      .setAttr('points', points);
  }

  /**
   * 多边形圆形
   * @param //x x坐标
   * @param //y y坐标
   */
  drawCircle(currentTool, x, y, group, shapePoints) {
    const _this = this;
    const { canvas, layer, scale } = _this;
    const circle = new Konva.Circle({
      name: currentTool.name + 'circle',
      x: x,
      y: y,
      radius: 5 / scale / layer.scaleX(),
      visible: true, //是否显示
      fill: currentTool.anchorColor,
      stroke: currentTool.anchorColor,
      draggable: false,
      strokeWidth: 0.5,
      strokeScaleEnabled: false,
      //增加点击区域
      hitStrokeWidth: 8 / scale / layer.scaleX(),
      //设置拖动区域，不能超过画布大小
      dragBoundFunc: function (pos) {
        //左上角
        if (pos.x < 0 && pos.y < 0) {
          return {
            x: 0,
            y: 0,
          };
        } //左侧
        else if (pos.x <= 0 && 0 <= pos.y && pos.y <= canvas.height()) {
          return {
            x: 0,
            y: pos.y,
          };
        }
        //左下角
        else if (pos.x < 0 && pos.y > canvas.height()) {
          return {
            x: 0,
            y: canvas.height(),
          };
        } //下侧
        else if (0 <= pos.x && pos.x <= canvas.width() && pos.y > canvas.height()) {
          return {
            x: pos.x,
            y: canvas.height(),
          };
        } //右下角
        else if (pos.x > canvas.width() && pos.y > canvas.height()) {
          return {
            x: canvas.width(),
            y: canvas.height(),
          };
        }
        //右侧
        else if (pos.x > canvas.width() && 0 <= pos.y && pos.y <= canvas.height()) {
          return {
            x: canvas.width(),
            y: pos.y,
          };
        }
        //右上角
        else if (pos.x > canvas.width() && pos.y < 0) {
          return {
            x: canvas.width(),
            y: 0,
          };
        } //上侧
        else if (0 <= pos.x && pos.x <= canvas.width() && pos.y < 0) {
          return {
            x: pos.x,
            y: 0,
          };
        }
        return pos;
      },
    });
    group.add(circle);
    let xChange, yChange;
    circle.on('mouseover', (e) => {
      _this.canvas.container().style.cursor = 'pointer';
    });
    circle.on('mousedown', (e) => {
      if (!_this.drawing) {
        circle.draggable(true);
        //将现在绘画的对象改为group
        _this.currentDrawingShape = circle.getParent();
      } else {
        circle.draggable(false);
      }
      e.cancelBubble = true;
    });
    circle.on('mouseleave', (e) => {
      _this.canvas.container().style.cursor = 'crosshair';
    });
    circle.on('dragstart', () => {
      const type = _this.getCurrentType();
      switch (type) {
        case 'line':
        case 'poly':
          //查找拖拽了多边形的哪个点
          for (var i = 0; i < shapePoints.length; i += 2) {
            if (circle.getAttr('x') === shapePoints[i] && circle.getAttr('y') === shapePoints[i + 1]) {
              xChange = i;
              yChange = i + 1;
              break;
            }
          }
          break;
      }
    });
    circle.on('dragmove', (e) => {
      const type = _this.getCurrentType();

      switch (type) {
        case 'line':
        case 'poly':
          //隐藏label
          _this.showHideLabel(false, false);
          //更改拖拽点的位置
          shapePoints[xChange] = circle.x();
          shapePoints[yChange] = circle.y();
          break;
      }
    });

    circle.on('dragend', (e) => {
      let isDrag = false;
      const type = _this.getCurrentType();
      const image = layer.getChildren((el) => el.getAttr('image'));

      if (image.length) {
        const imgWidth = image[0].getWidth() * _this.scale;
        const imgHeight = image[0].getHeight() * _this.scale;
        const _position = e.target.getPosition();
        if (imgWidth < _position.x) {
          // //console.log(('宽度拖拽出去了')
          const _x = imgWidth - 5;
          circle.setX(_x);
          shapePoints[xChange] = _x;
        }
        if (imgHeight < _position.y) {
          // //console.log(('高度拖拽出去了')
          const _y = imgHeight - 5;
          circle.setY(_y);
          shapePoints[yChange] = _y;
        }
      }

      switch (type) {
        case 'line':
        case 'poly':
          isDrag = true;
          break;
      }
      if (isDrag) {
        //修改标签位置
        _this.labelMove2NewPiosition(type);
        circle.draggable(false);
      }
      e.cancelBubble = true;
    });
    return circle;
  }

  drawLabel(currentTool, x, y, group, isInit = false) {
    const _this = this;
    const { color, name } = currentTool;
    const label = new Konva.Label({
      x: x,
      y: y,
      name: name + 'label',
      visible: true,
      opacity: 1,
    });
    const tag = new Konva.Tag({
      fill: color,
    });
    const currentLabels = this.layer.getChildren((el) => el.getAttr('name') === name + 'group');
    const lastLabel =
      currentLabels.length > 1
        ? currentLabels[currentLabels.length - 2]
            .getChildren((el) => el.getAttr('name') === name + 'label')[0]
            .getText()
            .text()
        : currentTool.label + '0';

    const num = isInit ? currentLabels.length + 1 : Number(lastLabel.replace(currentTool.label, '')) + 1;

    const text = new Konva.Text({
      text: currentTool.label + num,
      fontFamily: 'Calibri',
      fontSize: _this.getSize(12),
      padding: _this.getSize(10),
      fill: '#333',
    });
    label.add(tag);
    label.add(text);
    group.add(label);
    return label;
  }

  getSize(size) {
    return size / this.scale / this.layer.scaleX();
  }

  // 为传入的group添加监听事件
  addEvent(group, eventName, callback) {
    group.on(eventName, callback);
  }

  // 获取图片的宽高
  getImageSize() {
    const image = this.layer.getChildren((el) => el.getAttr('image'));
    if (image.length) {
      const imgWidth = image[0].getWidth() * this.scale;
      const imgHeight = image[0].getHeight() * this.scale;
      return { imgWidth, imgHeight };
    }
    return { imgWidth: 0, imgHeight: 0 };
  }

  // 节流函数
  throttle(func, delay) {
    let lastTimestamp = 0;

    return function (...args) {
      const currentTimestamp = Date.now();

      if (currentTimestamp - lastTimestamp >= delay) {
        func.apply(this, args);
        lastTimestamp = currentTimestamp;
      }
    };
  }

  // group 的dragmove事件
  groupDragmove(e) {
    const { currentDel: group, canvas } = this;
    //console.log(('groupDragmove', group, group.position());
    const groupX = group.position().x;
    const groupX2 = group.x();
    const groupY = group.position().y;
    const groupY2 = group.y();
    //console.log(('groupX', groupX, 'groupX2', groupX2, 'canvas.x()', canvas.x())
    //console.log(('groupY', groupY, 'groupY2', groupY2, 'canvas.y()', canvas.y())
    // 获取最新的Group的点的坐标
    const result = [];
    const groupPosition = group.position();
    group
      .getChildren((node) => node.getClassName() === 'Circle')
      .forEach((circle) => {
        const circlePosition = circle.position();
        const updatedX = groupPosition.x + circlePosition.x;
        const updatedY = groupPosition.y + circlePosition.y;
        result.push({ x: updatedX, y: updatedY });
        // circle.position({ x: updatedX, y: updatedY });
      });
    // //console.log(('ooooooo', result)
    // 遍历所有的circle点，获取到最小的x和y
    let minx = result[0].x;
    let miny = result[0].y;
    let maxx = result[0].x;
    let maxy = result[0].y;
    result.forEach((item) => {
      if (item.x < minx) {
        minx = item.x;
      }
      if (item.y < miny) {
        miny = item.y;
      }
      if (item.x > maxx) {
        maxx = item.x;
      }
      if (item.y > maxy) {
        maxy = item.y;
      }
    });
    //console.log(('minx', minx, 'miny', miny, 'maxx', maxx, 'maxy', maxy)
    // 将最小的x和y看作group的坐标
    // 获取画布的宽度和高度
    const { imgWidth, imgHeight } = this.getImageSize();
    //console.log(('imgWidth', imgWidth, 'imgHeight', imgHeight)

    // 目前不管是否超出画布的范围，都将group的坐标还原
    group.x(this.group.x);
    group.y(this.group.y);
    // 暂时注释，本期不支持拖拽
    // 判断四个点是否超出画布的范围
    // if (minx < 0 || miny < 0 || maxx > imgWidth || maxy > imgHeight) {
    //   // 超出了画布的范围，需要将group的坐标还原
    //   group.x(this.group.x);
    //   group.y(this.group.y);
    //   //console.log(('group.x()', group.x(), group.y())
    // } else {
    //   // this.group = {
    //   //   x: group.x(),
    //   //   y: group.y(),
    //   // }

    //   // 写一个节流函数，将group的坐标保存起来
    //   this.throttle(() => {
    //     this.group = {
    //       x: group.x(),
    //       y: group.y(),
    //     }
    //   }, 200);
    // }
    //console.log(('group.x()', group.x(), group.y())
    // if (minx < 0) {
    //   group.x(0);
    //   group.y(0);
    // }
    // if (miny < 0) {
    //   group.y(0);
    //   group.x(0)
    // }
    // if (maxx > imgWidth) {
    //   //console.log(('maxx > imgWidth', maxx - imgWidth)
    //   group.x(maxx - imgWidth);
    //   group.y(0)
    // }
    // if (maxy > imgHeight) {
    //   group.y(maxy - imgHeight);
    //   group.x(0)
    // }
    // if (groupX < minX) {
    //   // group.x(minX);
    //   group.setAbsolutePosition({ x: minX, y: groupY });
    // } else if (groupX > maxX) {
    //   group.x(maxX);
    // }

    // if (groupY < minY) {
    //   // group.y(minY);
    //   group.setAbsolutePosition({ x: groupX, y: minY });
    // } else if (groupY > maxY) {
    //   group.y(maxY);
    // }
  }

  groupDragend(e) {
    // //console.log(('groupDragend', e.target)
    // const groupPosition = e.target.position();
    // let result = [];
    // e.target.getChildren(node => node.getClassName() === 'Circle').forEach(circle => {
    //   const circlePosition = circle.position();
    //   const updatedX = groupPosition.x + circlePosition.x;
    //   const updatedY = groupPosition.y + circlePosition.y;
    //   result.push({ x: updatedX, y: updatedY })
    //   // circle.position({ x: updatedX, y: updatedY });
    // });
    // //console.log(('result', result);
  }

  drawLine(currentTool, points, group) {
    const _this = this;
    const line = new Konva.Line({
      name: currentTool.name + 'line',
      points: points,
      stroke: currentTool.lineColor,
      strokeWidth: 2,
      visible: true,
      draggable: false,
      closed: true,
      strokeScaleEnabled: false,
      opacity: 1, //透明度
    });
    _this.currentDrawingShape = line;
    group.add(line);

    line.getParent().on('mouseleave', (e) => {
      _this.canvas.container().style.cursor = 'crosshair';
    });

    line.getParent().on('mousedown', (e) => {
      if (e.evt.button === 0) {
        //绘画结束
        if (!_this.drawing) {
          _this.canvas.container().style.cursor = 'move';
          //设置现在绘画节点的对象为该多边形和顶点的组
          _this.currentDrawingShape = line.getParent();
          // 如果要让顶点和多边形一起拖拽，必须设置，多边形不能被拖拽
          line.setAttr('draggable', false);
          line.getParent().setAttr('draggable', true);
          //使所有顶点在顶层显示
          _this.canvas.find('Circle').forEach((el) => {
            el.moveToTop();
          });
          //添加删除撤销对象
          _this.currentDel = _this.currentDrawingShape;
          _this.currentCancel = _this.currentDrawingShape;
          _this.addEvent(_this.currentDrawingShape, 'dragmove', (e) => _this.groupDragmove(e));
          _this.addEvent(_this.currentDrawingShape, 'dragend', (e) => _this.groupDragend(e));
          _this.layer.draw();
        } else {
          _this.canvas.container().style.cursor = 'crosshair';
          line.getParent().setAttr('draggable', false);
        }
      }
    });
    line.getParent().on('dragend', (e) => {
      _this.canvas.container().style.cursor = 'crosshair';
      //设置组不能拖动
      _this.currentDrawingShape.setAttr('draggable', false);
    });
    return line;
  }
  /**
   * 线
   * @param //points 坐标数组
   */
  drawPolyLine(currentTool, points, group) {
    const line = new Konva.Line({
      name: currentTool.name + 'line',
      points: points,
      stroke: currentTool.lineColor,
      strokeWidth: 1,
      visible: true,
      draggable: false,
      closed: true,
      strokeScaleEnabled: false,
      opacity: 1, //透明度
    });
    group.add(line);
    return line;
  }

  /**
   *多边形
   * @param currentTool
   * @param points 多边形绘画的各个顶点，类型数组
   */
  drawPolygon(currentTool, points, group) {
    const _this = this;
    const poly = new Konva.Line({
      name: currentTool.name + 'poly',
      points: points,
      fill: currentTool.color,
      stroke: currentTool.color,
      strokeWidth: 1,
      draggable: false,
      opacity: 0.4,
      lineCap: 'round',
      lineJoin: 'round',
      closed: true,
      strokeScaleEnabled: false,
    });
    _this.currentDrawingShape = poly;
    group.add(poly);

    poly.getParent().on('mouseleave', (e) => {
      _this.canvas.container().style.cursor = 'crosshair';
    });

    poly.getParent().on('mousedown', (e) => {
      if (e.evt.button === 0) {
        //绘画结束
        if (!_this.drawing) {
          _this.canvas.container().style.cursor = 'move';
          //设置现在绘画节点的对象为该多边形和顶点的组
          _this.currentDrawingShape = poly.getParent();
          // 如果要让顶点和多边形一起拖拽，必须设置，多边形不能被拖拽
          poly.setAttr('draggable', false);
          poly.getParent().setAttr('draggable', true);
          //使所有顶点在顶层显示
          _this.canvas.find('Circle').forEach((el) => {
            el.moveToTop();
          });
          //添加删除撤销对象
          _this.currentDel = _this.currentDrawingShape;
          _this.currentCancel = _this.currentDrawingShape;
          _this.addEvent(_this.currentDrawingShape, 'dragmove', (e) => _this.groupDragmove(e));
          _this.addEvent(_this.currentDrawingShape, 'dragend', (e) => _this.groupDragend(e));
          _this.layer.draw();
        } else {
          _this.canvas.container().style.cursor = 'crosshair';
          poly.getParent().setAttr('draggable', false);
        }
      }
    });
    poly.getParent().on('dragend', (e) => {
      _this.canvas.container().style.cursor = 'crosshair';
      //设置组不能拖动
      _this.currentDrawingShape.setAttr('draggable', false);
    });
    return poly;
  }

  /**
   * 在画布上鼠标点下发生的事件
   * @param currentTool 当前选择的工具
   * @param e 传入的event对象
   */
  canvasMousedown(currentTool, e) {
    const _this = this;
    if (!currentTool.type) {
      _this.callback && _this.callback('warning', '请选择标注工具！');
      return;
    }
    //最好使用konva提供的鼠标xy点坐标
    const mousePos = _this.canvas.getPointerPosition();
    //考虑鼠标缩放
    const x = (mousePos.x / _this.scale - _this.layer.getAttr('x')) / _this.layer.scaleX();
    const y = (mousePos.y / _this.scale - _this.layer.getAttr('y')) / _this.layer.scaleY();
    let group;
    switch (currentTool.type) {
      case 'line':
        if (_this.linePoints.length === 0) {
          group = new Konva.Group({
            name: currentTool.name + 'group',
            draggable: false,
          });
          _this.linePoints = [x, y];
          //添加线的起点
          _this.drawCircle(currentTool, x, y, group, _this.linePoints);
          _this.drawLine(currentTool, _this.linePoints, group);
          _this.layer.add(group);
          _this.currentCancel = group;
          //添加标签
          _this.drawLabel(currentTool, x, y, group).hide();
          //使所有顶点在顶层显示
          _this.canvas.find('Circle').forEach((el) => {
            el.moveToTop();
          });
          _this.layer.draw();
        }
        break;
      case 'poly':
        //如果数组长度小于2，初始化多边形和顶点，使它们成为一组,否则什么都不做
        if (_this.polygonPoints.length < 2) {
          //拖拽组
          group = new Konva.Group({
            name: currentTool.name + 'group',
            draggable: false,
          });
          _this.polygonPoints = [x, y];
          //添加多边形的点
          _this.drawCircle(currentTool, x, y, group, _this.polygonPoints);

          //绘画多边形
          _this.drawPolygon(currentTool, _this.polygonPoints, group);
          //添加多边形的边
          _this.drawPolyLine(currentTool, _this.polygonPoints, group);
          _this.layer.add(group);
          _this.currentCancel = group;
          //添加标签
          _this.drawLabel(currentTool, x, y, group).hide();
        } else {
          //多边形增加顶点
          _this.drawCircle(currentTool, x, y, _this.currentDrawingShape.getParent(), _this.polygonPoints);
          _this.polygonPoints.push(...[x, y]);
          //绘画多边形
          _this.currentDrawingShape.setAttr('points', _this.polygonPoints);
          //group继续添加多边形的边
          _this.currentDrawingShape
            .getParent()
            .getChildren((node) => {
              return node.getAttr('name') === currentTool.name + 'line';
            })[0]
            .setAttr('points', _this.polygonPoints);
        }
        //使所有顶点在顶层显示
        _this.canvas.find('Circle').forEach((el) => {
          el.moveToTop();
        });
        _this.layer.draw();
        break;
    }
    _this.drawing = true;
  }

  /**
   * 鼠标在画布弹起
   * @param currentTool 当前选择的工具
   * @param e 传入的event对象
   */
  canvasMouseup(currentTool, e) {
    const _this = this;
    const _parent = _this.currentDrawingShape.getParent();
    if (_parent) {
      switch (currentTool.type) {
        case 'line':
          break;
        case 'poly':
          if (e.evt.button === 2) {
            _this.currentDrawingShape = _parent;
            //显示标签
            _this.currentDrawingShape
              .getChildren((el) => {
                return el.getAttr('name') === currentTool.name + 'label';
              })[0]
              .show();
            //右键弹起
            _this.polygonPoints = [];
            //使所有顶点在顶层显示
            _this.canvas.find('Circle').forEach((el) => {
              el.moveToTop();
            });
          }
          break;
      }
      _this.layer.draw();
    }
  }

  /**
   * 鼠标在画布上移动事件
   * @param currentTool 当前选择的工具
   * @param e 传入的event对象
   */
  canvasMousemove(currentTool) {
    const _this = this;
    const mousePos = _this.canvas.getPointerPosition();
    const x = (mousePos.x / _this.scale - _this.layer.getAttr('x')) / _this.layer.scaleX();
    const y = (mousePos.y / _this.scale - _this.layer.getAttr('y')) / _this.layer.scaleY();
    let tempPoints = null;
    switch (currentTool.type) {
      case 'line':
        if (_this.linePoints.length === 2) {
          tempPoints = [..._this.linePoints, ...[x, y]];
        }
        break;
      case 'poly':
        //多边形初始化后，如果数组长度大于2，鼠标移动时，实时更新下一个点
        if (_this.polygonPoints.length >= 2) {
          tempPoints = [..._this.polygonPoints, ...[x, y]];
        }
        break;
    }
    if (tempPoints) {
      _this.canvas.container().style.cursor = 'crosshair';
      //更新图形的线
      _this.currentDrawingShape
        .getParent()
        .getChildren((el) => {
          return el.getAttr('name') === currentTool.name + 'line';
        })[0]
        .setAttr('points', tempPoints);
      //更新
      _this.currentDrawingShape.setAttr('points', tempPoints);
      //使所有顶点在顶层显示
      _this.canvas.find('Circle').forEach((el) => {
        el.moveToTop();
      });
    }
    _this.layer.draw();
  }

  showHideLabel(isParent, isShow) {
    const { currentDrawingShape } = this;
    const _parent = isParent ? currentDrawingShape.getParent() : currentDrawingShape;
    const type = this.getType();

    if (_parent) {
      isShow
        ? _parent
            .getChildren((node) => {
              return node.getAttr('name') === type + 'label';
            })[0]
            .show()
        : _parent
            .getChildren((node) => {
              return node.getAttr('name') === type + 'label';
            })[0]
            .hide();
    }
  }

  getCurrentType() {
    const groupName = this.getType();
    const tools = this.toolsList.find((tool) => tool.name === groupName);
    return tools ? tools.type : this.currentTool.type;
  }

  getType() {
    const { currentDrawingShape, currentTool } = this;
    const type = this.getGroup(currentDrawingShape);

    return type ? type.replace('group', '') : currentTool.type;
  }

  getGroup(group) {
    return group.getType() === 'Group' ? group.getName() : this.getGroup(group.getParent());
  }

  labelMove2NewPiosition(type) {
    const { currentDrawingShape, canvas, currentTool } = this;
    const groupName = this.getType();
    const currentShape = currentDrawingShape.getChildren((node) => {
      return node.getAttr('name') === groupName + type;
    })[0];
    const label = currentDrawingShape.getChildren((node) => {
      return node.getAttr('name') === groupName + 'label';
    })[0];
    label.setAttrs({
      x: currentShape.points()[0],
      y: currentShape.points()[1],
      visible: true,
    });
    canvas.find('Circle').forEach((el) => {
      el.moveToTop();
    });
    this.getData();
  }

  clearData() {
    if (this.drawing) {
      this.currentDrawingShape?.getParent()?.destroy();
      this.polygonPoints = [];
      this.linePoints = [];
      this.drawing = false;
      this.layer.draw();
    }
  }

  //重新调整画布
  resizeCanvas(annotateRef) {
    const _this = this;
    nextTick(() => {
      const { container, canvasWidth, canvasHeight, canvas, layer } = _this;
      const _scale = container.clientWidth / canvasWidth;
      _this.scale = _scale;
      canvas.width(canvasWidth * _scale);
      canvas.height(canvasHeight * _scale);
      canvas.scale({ x: _scale, y: _scale });
      // 维持原来大小
      layer.find('Circle').forEach((el) => {
        el.setAttr('radius', 5 / _scale / layer.scaleX());
      });
      layer.find('Label').forEach((el) => {
        el.getText().setAttrs({
          fontSize: _this.getSize(12),
          padding: _this.getSize(10),
        });
      });
      canvas.draw();
    });
  }

  getGroupData() {
    const { layer, currentTool } = this;
    const groups = layer.getChildren();
    const group = groups[groups.length - 1];
    const label = group.getChildren((el) => el.getAttr('name') === currentTool.name + 'label');
    const data = {
      id: group._id,
      name: group.getName(),
      label: label.length ? label[0].getText().text() : '',
    };

    return data;
  }

  deleteGroup(data) {
    const { id, name, label } = data;
    const { layer } = this;
    const groups = layer.getChildren((el) => el.getAttr('name') === name).filter((g) => g._id === id);
    if (groups.length) {
      //console.log(('idToDelete')
      this.groupDestroy(groups[0]);
    } else {
      // 此时的id已经发生变化了，无法找到对应的group，需通过label去找到对应的group，label也是唯一的
      const groupsB = layer.getChildren((el) => el.getAttr('name') === name);
      const test = groupsB.filter((g) => {
        const bb = g.getChildren((el) => el.getAttr('name').includes('label'));
        const labelText = bb[0].getText().text();
        return labelText === label;
      });
      //console.log(('labelToDelete')
      this.groupDestroy(test[0]);
    }
  }

  groupDestroy(group) {
    group.destroy && group.destroy();
    this.getData();
  }

  getData() {
    const { layer } = this;
    const children = layer.getChildren((el) => !el.getAttr('image'));
    const _data = {};

    // Object.keys(labelObj.value).forEach((key) => {
    //   _data[key] = [];
    // });
    labelObj.forEach((item) => {
      _data[item.name] = [];
    })
    children.forEach((group) => {
      const name = group.getName().replace('group', '');
      const circles = group.getChildren((child) => child.getName() === `${name}circle`);
      const position = [];
      circles.forEach((circle) => {
        const xy = circle.getPosition();
        position.push(...[parseInt(xy.x), parseInt(xy.y)]);
      });
      _data[name].push(position);
    });

    this.annotateData = _data;
    //console.log((this.annotateData, 'annotateData');

    return _data;
  }

  clearGroupData(isImgDestroy) {
    const { layer } = this;
    const children = isImgDestroy ? layer.getChildren() : layer.getChildren((el) => !el.getAttr('image'));

    children.forEach((group) => {
      group.destroy && group.destroy();
    });

    this.annotateData = {};
  }

  setData = function (data, img) {
    const _this = this;
    const { layer } = _this;

    if (img && layer.getChildren()[0].getAttr('image') && !layer.getChildren()[0].getAttr('image').src.includes(img)) {
      _this.clearGroupData(true);
      _this.annotateData = data;
      _this.initImage(img);
      return;
    }

    _this.clearGroupData();

    // Object.keys(labelObj.value).forEach((key) => {
    labelObj.forEach((item) => {
      let key = item.name;
      let type = item.type;
      const _data = data[key];
      if (_data && _data.length) {
        _this.currentTool = _this.toolsList.find((t) => t.name === key);
        const { currentTool } = _this;
        _data.forEach((d) => {
          const group = new Konva.Group({
            name: currentTool.name + 'group',
            draggable: false,
          });
          switch (type) {
            case 'shieldRegions':
            case 'polyLines':
            case 'indoorRois':
              _this.polygonPoints = d;
              _this.drawCircle(currentTool, d[0], d[1], group, _this.polygonPoints);
              _this.drawPolygon(currentTool, _this.polygonPoints, group);
              _this.drawPolyLine(currentTool, _this.polygonPoints, group);
              _this.drawLabel(currentTool, d[0], d[1], group, true);

              for (let i = 2; i < d.length; i += 2) {
                _this.drawCircle(currentTool, d[i], d[i + 1], group, _this.polygonPoints);
                // _this.polygonPoints = [..._this.polygonPoints, ...[d[i], d[i + 1]]];
              }
              layer.add(group);
              _this.polygonPoints = [];
              _this.emitList[currentTool.name + eventSuffix.add](_this.getGroupData());

              break;
            case 'borderLine':
              _this.linePoints = [d[0], d[1]];
              _this.drawCircle(currentTool, d[0], d[1], group, _this.linePoints);
              _this.drawLine(currentTool, [d[0], d[1]], group);
              _this.drawLabel(currentTool, d[0], d[1], group, true);
              layer.add(group);
              _this.endDrawPoints(d[2], d[3], 'linePoints');
              _this.linePoints = [];
              _this.emitList[currentTool.name + eventSuffix.add](_this.getGroupData());
              // _this.getData();
              break;
          }
          _this.canvas.find('Circle').forEach((el) => {
            el.moveToTop();
          });
          layer.draw();
        });
      }
    });

    // 把工具栏重置为 “多边形检测区”
    _this.currentTool = _this.toolsList[1];
  }.bind(this);

  getAnnotateData() {
    return this.annotateData;
  }

  initImage(img) {
    const imageObj = new Image();
    const _this = this;
    imageObj.onload = function (e) {
      const { canvasWidth, canvasHeight } = _this;
      // 整个画布，包括空白区域所在的地方
      //console.log(('canvasWidth', canvasWidth)
      //console.log(('canvasHeight', canvasHeight)
      const { width, height } = e.target;
      const wScale = width / canvasWidth;
      const hScale = height / canvasHeight;

      _this.shape = new Konva.Image({
        image: imageObj,
        width: wScale > hScale ? canvasWidth : width / (height / canvasHeight),
        height: wScale > hScale ? height / (width / canvasWidth) : canvasHeight,
      });
      _this.layer.add(_this.shape);
      _this.init();
      // 实际图片所在的地方，仅指图片所在的地方
      let imgAreaWidth = wScale > hScale ? canvasWidth : width / (height / canvasHeight);
      let imgAreaHeight = wScale > hScale ? height / (width / canvasWidth) : canvasHeight;
      _this.imgAreaWidth = imgAreaWidth;
      _this.imgAreaHeight = imgAreaHeight;
      _this.imgRealWidth = width;
      _this.imgRealHeight = height;
      //console.log(('imgInCanvasWidth:', imgAreaWidth)
      //console.log(('imgInCanvasHeight:', imgAreaHeight)
      //console.log(('imgRealWidth:', width)
      //console.log(('imgRealHeight:', height)
    };
    // imageObj.src = img;
    imageObj.src = new URL(img, import.meta.url).href;
  }

  init() {
    const { annotateData, setData } = this;
    // if (Object.keys(labelObj.value).some((key) => annotateData[key] && annotateData[key].length)) {
    //   setData(annotateData);
    // }
    if (labelObj.some((item) => annotateData[item.name] && annotateData[item.name].length)) {
      setData(annotateData);
    }
  }

  getImgAreaSize() {
    let imgSizeObj = {
      imgAreaWidth: this.imgAreaWidth,
      imgAreaHeight: this.imgAreaHeight,
      imgRealWidth: this.imgRealWidth,
      imgRealHeight: this.imgRealHeight,
    };
    //console.log(('imgSizeObj', imgSizeObj)
    return imgSizeObj;
  }

  destroy() {
    this.canvas.destroy();
  }
}