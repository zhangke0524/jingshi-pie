# Pie Chart Component

A Vue 3 pie chart component based on jingshi.

## Installation

```bash
npm install @zhangke-ui/jingshi-components
```

## Usage

### Global Registration

```js
import { createApp } from 'vue'

// main.ts
import jingshiComponents from '@zhangke-ui/jingshi-components'
import '@zhangke-ui/jingshi-components/style.css'

const app = createApp(App)
app.use(jingshiComponents)
```

### Local Registration

```vue
<template>
  <pie-chart :data="chartData" :title="'My Chart'" />
  <pie-chart :data="chartData" :title="'My Chart'" />
</template>

<script setup>
import { PieChart } from '@zhangke-ui/jingshi-components'
import { BarChart } from '@zhangke-ui/jingshi-components'

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
