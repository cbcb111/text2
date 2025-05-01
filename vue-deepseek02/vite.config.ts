import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
/* export default defineConfig({
  plugins: [vue()],
}) */
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 代理所有以 /api 开头的请求到 Ollama 服务
      '/ollama': {
        target: 'http://localhost:11434', // Ollama 服务地址
        changeOrigin: true, // 允许跨域
        rewrite: (path) => path.replace(/^\/ollama/, '') // 移除 /ollama 前缀
      }
    }
  }
})