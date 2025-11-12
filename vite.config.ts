import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        // 所有以 mdui- 开头的标签名都是 mdui 组件
        isCustomElement: (tag) => tag.startsWith('mdui-'),
      },
    },
  }),],
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
})
