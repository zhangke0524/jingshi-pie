# Jingshi Components

A Vue 3 component library based on jingshi.

## Installation

```bash
npm install @zhangke-ui/jingshi-components
```

## Usage

### Global Registration (Recommended)

```js
import { createApp } from 'vue'

// main.ts
import jingshiComponents from '@zhangke-ui/jingshi-components'
import '@zhangke-ui/jingshi-components/dist/style.css'

const app = createApp(App)
app.use(jingshiComponents)
```

After global registration, you can use components in your templates in two ways:

1. Using PascalCase (recommended):
```vue
<template>
  <PieChart :data="chartData" :title="'My Chart'" />
  <BarChart :data="chartData" :title="'My Chart'" />
</template>

<script setup>
// No need to import components
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

2. Using kebab-case:
```vue
<template>
  <pie-chart :data="chartData" :title="'My Chart'" />
  <bar-chart :data="chartData" :title="'My Chart'" />
</template>
```

### Local Registration (Optional)【备注：暂不支持，请使用全局注册】

If you prefer to import components individually:

```vue
<template>
  <PieChart :data="chartData" :title="'My Chart'" />
  <BarChart :data="chartData" :title="'My Chart'" />
</template>

<script setup>
import { PieChart, BarChart } from '@zhangke-ui/jingshi-components'

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

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | Array | [] | Chart data array |
| title | String | '' | Chart title |
| colorList | Array | default colors | Custom color list for chart |

## License

MIT
