export function drawTextWithBackground(
  ctx: any,
  text: string,
  x: number,
  y: number,
  backgroundColor: string,
  textColor: string,
  imageWidth: number, // 添加图片宽度参数
  padding = 10,
) {
  ctx.save();

  // 根据图片宽度动态计算字体大小
  // 假设基准图片宽度为 1920px，基准字体大小为 50px
  const baseFontSize = 50;
  const baseWidth = 1920;
  const scaleFactor = imageWidth / baseWidth;
  const fontSize = Math.max(Math.floor(baseFontSize * scaleFactor), 10); // 设置最小字体大小为 24px

  // 设置动态计算后的字体大小
  ctx.font = `${fontSize}px Arial`;

  // 获取文本度量
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  // 动态计算 padding（可选）
  const scaledPadding = Math.max(Math.floor(padding * scaleFactor), 5); // 设置最小 padding 为 5px

  // 绘制背景
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(x - scaledPadding, y - textHeight - scaledPadding, textWidth + scaledPadding * 2, textHeight + scaledPadding * 2 + 10);

  // 绘制文本
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);

  ctx.restore();

  return {
    width: textWidth + scaledPadding * 2,
    height: textHeight + scaledPadding * 2,
  };
}
