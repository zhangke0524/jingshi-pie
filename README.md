# Jingshi Components

基于 Vue 3 的组件库。

## 安装

```bash
npm install @zhangke-ui/jingshi-components
```

## 使用方式

### 1. 引入样式（必需）

首先，在项目的主入口文件（main.ts 或 main.js）中引入样式：

```js
// main.ts or main.js
import '@zhangke-ui/jingshi-components/dist/style.css'
```

### 2. 选择组件引入方式

#### 全局注册（推荐）

```js
// main.ts or main.js
import { createApp } from 'vue'
import jingshiComponents from '@zhangke-ui/jingshi-components'

const app = createApp(App)
app.use(jingshiComponents)
```

全局注册后，您可以在模板中使用以下两种方式：

1. 使用 PascalCase 命名（推荐）：
```vue
<template>
  <PieChart :data="chartData" :title="'My Chart'" />
  <BarChart :data="chartData" :title="'My Chart'" />
</template>

<script setup>
// 无需导入组件
const chartData = [
  {
    countResults: [
      {
        algorithmName: "Category 1",
        countNumber: 100
      },
      {
        algorithmName: "Category 2",
        countNumber: 200
      }
    ],
    dateType: "day"
  }
]
</script>
```

2. 使用 kebab-case 命名：
```vue
<template>
  <pie-chart :data="chartData" :title="'My Chart'" />
  <bar-chart :data="chartData" :title="'My Chart'" />
</template>
```

#### 按需引入

您也可以在组件中单独引入需要的组件：

```vue
<template>
  <PieChart :data="chartData" :title="'My Chart'" />
  <BarChart :data="chartData" :title="'My Chart'" />
</template>

<script setup>
import { PieChart, BarChart } from '@zhangke-ui/jingshi-components'
import '@zhangke-ui/jingshi-components/dist/style.css'

const chartData = [
  {
    countResults: [
      {
        algorithmName: "Category 1",
        countNumber: 100
      },
      {
        algorithmName: "Category 2",
        countNumber: 200
      }
    ],
    dateType: "day"
  }
]
</script>
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|------|------|---------|-------------|
| data | Array | [] | 图表数据数组 |
| title | String | '' | 图表标题 |
| colorList | Array | 默认颜色 | 自定义图表颜色列表 |

## 许可证

MIT
