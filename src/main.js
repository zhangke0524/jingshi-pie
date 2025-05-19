import { createApp } from 'vue'
import './style.css'
import './main.css'
import App from './App.vue'
// import 'virtual:svg-icons-register'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'


const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
