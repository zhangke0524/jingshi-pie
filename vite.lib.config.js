import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [
    vue(),
    svgLoader({
      svgoConfig: {
        multipass: true
      },
      defaultImport: 'component'
    }),
  ],
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
      // 只将 Vue 设置为外部依赖，其他依赖都打包进库中
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        },
      }
    },
    cssCodeSplit: false,
    minify: false,
    sourcemap: true
  }
}) 