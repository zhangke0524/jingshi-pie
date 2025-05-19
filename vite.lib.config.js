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
      fileName: (format) => `jingshi-components.${format}.js`,
      cssFileNames: (format) => `jingshi-components.${format}.css`
    },
    rollupOptions: {
      external: ['vue', 'echarts', 'element-plus'],
      output: {
        globals: {
          vue: 'Vue',
          echarts: 'echarts',
          'element-plus': 'ElementPlus'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'jingshi-components.css'
          return assetInfo.name
        }
      }
    },
    cssCodeSplit: false,
    minify: false,
    sourcemap: true
  }
}) 