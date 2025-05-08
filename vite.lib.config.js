import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'jingshiComponents',
      // 软件包输出文件的名称
      fileName: (format) => `jingshi-components.${format}.js`,
      // 软件包输出 CSS 文件的名称
      cssFileNames: (format) => `jingshi-components.${format}.css`
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'echarts', 'element-plus'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          echarts: 'echarts',
          'element-plus': 'ElementPlus'
        },
        // 确保样式文件被正确打包
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css'
          return assetInfo.name
        }
      }
    },
    // 确保生成 sourcemap
    // sourcemap: true,
    // 确保生成 CSS 文件
    cssCodeSplit: false
  }
}) 