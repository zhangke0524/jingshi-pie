import { drawTextWithBackground } from './drawTextWithBackground';

/**
 * @method renderImgWithData 根据图片地址和检测框坐标，进行绘制，最后输出混合后的图片
 * @param {string} imgUrl 图片地址
 * @param {array} points 检测框坐标，二维数组
 * @param {string} algorithmName 检测算法名称，非必传
 * @param {string} serviceName 检测服务名称，非必传
 * @param {number} peopleCountNumber 检测到的人数，非必传
 * @param {number} peopleCountMinValue 检测到的人数最小值，非必传
 * @param {number} peopleCountMaxValue 检测到的人数最大值，非必传
 * @returns {string} 返回绘制后的图片地址
*/
export function renderImgWithData(imgUrl, points, algorithmName='', serviceName='', peopleCountNumber=0, peopleCountMinValue=0, peopleCountMaxValue=0) {
  return new Promise((resolve, reject) => {
    if (!imgUrl) {
      console.error("imgUrl cannot be empty");
      return;
    }
    if (!points) {
      console.error("points cannot be empty");
      return;
    }
    let polyList = [];
    // 取出检测框的坐标值
    if (points && points.length) {
      polyList = JSON.parse(points);
    }

    // 绘制图片上的检测框
    let img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgUrl;
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (!ctx) return;
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        0,
        0,
        img.width,
        img.height
      );
      ctx.lineWidth = 3;
      ctx.strokeStyle = "red";

      if (algorithmName && algorithmName === "安全通道占用") {
        ctx.font = "60px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("存在占用", 800, 80);
      }

      // 在当前图片的左下角绘制文字(仅人数异常检测算法)
      if (serviceName && serviceName === "ppcount") {
        // 防止图片过小，导致文字绘制不出来从而报错
        if (img.width > 10 && img.height > 150) {
          // 计算位置（也可以使用相对比例）
          let firstLinePositionHeight = img.height - img.height * 0.15; // 距底部15%
          let secondLinePositionHeight = img.height - img.height * 0.05; // 距底部5%
          const text1 = `当前检测人数：${peopleCountNumber}`;
          const text2 = `允许进入人数范围：${peopleCountMinValue} ~ ${peopleCountMaxValue}`;
          drawTextWithBackground(
            ctx,
            text1,
            10,
            firstLinePositionHeight,
            "rgba(0, 0, 0, 0.3)",
            "red",
            img.width
          );
          drawTextWithBackground(
            ctx,
            text2,
            10,
            secondLinePositionHeight,
            "rgba(0, 0, 0, 0.3)",
            "red",
            img.width
          );
        }
      }

      // 绘制检测框多边形
      for (let i = 0; i < polyList.length; i++) {
        // 如果返回的是两个点，那么要把这两个点当成对角线,计算出另外两个点
        if (polyList[i].length === 4) {
          let x1 = polyList[i][0];
          let y1 = polyList[i][1];
          let x2 = polyList[i][2];
          let y2 = polyList[i][3];
          polyList[i] = [x1, y1, x2, y1, x2, y2, x1, y2];
        }
        ctx.beginPath();
        ctx.moveTo(polyList[i][0], polyList[i][1]);
        for (let j = 2; j < polyList[i].length; j += 2) {
          ctx.lineTo(polyList[i][j], polyList[i][j + 1]);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 通过路径的后缀名来判断图片的格式，如果是jpg格式，就用jpeg，否则用png
      // 其中后缀的格式为:jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...
      let suffix = imgUrl.split(".").pop()?.split("?")[0];
      let imgType = "image/png";
      if (suffix === "jpg" || suffix === "jpeg") {
        imgType = "image/jpeg";
      } else {
        imgType = "image/png";
      }

      // 将canvas转为图片
      let imgData = canvas.toDataURL(imgType);
      console.log("imgData", imgData);
      resolve(imgData);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
}
