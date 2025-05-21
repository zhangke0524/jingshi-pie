import { defineConfig } from "vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import vue from "@vitejs/plugin-vue";
import path from "path";
// import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import svgLoader from "vite-svg-loader";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    // createSvgIconsPlugin({
    //   iconDirs: [path.resolve(process.cwd(), "src/assets/icons")],
    //   symbolId: "icon-[name]",
    // }),
    svgLoader({
      svgoConfig: {
        multipass: true
      },
      defaultImport: 'component'
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    // 启用符号链接解析
    preserveSymlinks: true,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.js"),
      name: "jingshiComponents",
      // 软件包输出文件的名称
      fileName: (format) => `jingshi-components.${format}.js`,
      // 软件包输出 CSS 文件的名称
      cssFileNames: (format) => `jingshi-components.${format}.css`
    },
    rollupOptions: {
      external: ['vue', 'echarts', 'element-plus'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: "Vue",
          echarts: "echarts",
          "element-plus": "ElementPlus"
        },
      }
    },
    cssCodeSplit: false,
    minify: false,
  },
  // server: {
  //   port: 8030,
  //   host: true,
  //   open: false,
  //   proxy: {
  //     // 此处是用于项目中三个ws地方的代理，分别是：1.消息中心；2.首页报警推送；3.点播报警推送
  //     // ws的target最好设置成跟下方/api的target一样，否则可能会连接不上ws服务器
  //     // 另外，/websockets要写在/api的前面，否则会被拦截，直接匹配到/api中去了，导致匹配不到
  //     "/api/websockets": {
  //       target: "ws://192.168.5.114:8030",
  //       // target: 'ws://10.15.11.26:8030',
  //       ws: true,
  //       changeOrigin: true,
  //       // rewrite: (p) => p.replace(/^\/api\/websockets/, '/api'),
  //     },
  //     "/api": {
  //       target: "http://192.168.5.114:8030",
  //       // target: 'http://10.15.11.26:8030',
  //       changeOrigin: true,
  //       // rewrite: (p) => p.replace(/^\/api/, ''),
  //       ws: false,
  //     },
  //     "/exportApi": {
  //       target: "http://192.168.5.114:8083",
  //       changeOrigin: true,
  //       rewrite: (p) => p.replace(/^\/exportApi/, ""),
  //     },
  //   },
  // },
});
