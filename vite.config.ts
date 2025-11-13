import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动导入 Vuetify 组件和样式
    vuetify({
      autoImport: true,
      styles: 'sass',
    })
  ],
  // 配置静态资源处理
  server: {
    // 设置适当的响应头以支持WebAssembly
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // 配置构建选项
  build: {
    // 允许导入WebAssembly文件
    rollupOptions: {
      output: {
        // 保持wasm文件的原始名称
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // 禁用WebAssembly的内联
    assetsInlineLimit: 0,
  },
  // 确保 Vuetify 的样式能正确加载
  define: {
    'process.env.DEBUG': 'false',
  },
})
