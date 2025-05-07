# Pie Chart Component

A Vue 3 pie chart component based on ECharts.

## Installation

```bash
npm install @jing-shi/pie-chart-component
```

## Usage

### Global Registration

```js
import { createApp } from 'vue'

// main.ts
import PieChartComponent from '@jing-shi/pie-chart-component'
import '@jing-shi/pie-chart-component/style.css'

const app = createApp(App)
app.use(PieChartComponent)
```

### Local Registration

```vue
<template>
  <pie-chart :data="chartData" :title="'My Chart'" />
</template>

<script setup>
import { PieChart } from '@jing-shi/pie-chart-component'
import '@jing-shi/pie-chart-component/style.css'

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
  // ... more data
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
