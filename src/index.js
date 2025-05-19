import PieChart from './components/pieChart.vue'
import BarChart from './components/barChart.vue'
import './styles/index.css'
import { renderImgWithData } from './utils/renderImgWithData'
import ImgLabel from './components/imgLabel/index.vue'

// 导出所有组件和函数
export {
  PieChart,
  BarChart,
  ImgLabel,
  renderImgWithData
}

// 导出默认组件
const components = {
  PieChart,
  BarChart,
  ImgLabel
}

// 导出默认安装函数
const install = (app) => {
  // 注册所有组件
  Object.entries(components).forEach(([name, component]) => {
    // 同时注册 PascalCase 和 kebab-case 格式
    app.component(name, component) // 注册为 PascalCase
    const kebabName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    app.component(kebabName, component) // 注册为 kebab-case
  })
}

export default {
  install,
  PieChart,
  BarChart,
  ImgLabel,
  renderImgWithData
} 