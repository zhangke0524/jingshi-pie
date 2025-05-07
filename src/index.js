import PieChart from './components/pieChart.vue'
import './styles/index.css'

// 导出组件
export { PieChart }

// 导出默认组件
export default {
  install: (app) => {
    app.component('PieChart', PieChart)
  }
} 