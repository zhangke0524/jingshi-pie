import PieChart from './components/pieChart.vue'
import BarChart from './components/barChart.vue'
import './styles/index.css'

// 导出组件
export { PieChart, BarChart }

// 导出默认组件
export default {
  install: (app) => {
    app.component('PieChart', PieChart)
    app.component('BarChart', BarChart)
  }
} 