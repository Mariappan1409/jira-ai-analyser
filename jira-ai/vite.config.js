import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/jira': {
        target: 'https://jira-ai-analyser7.atlassian.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/jira/, ''),
      }
    }
  }
})