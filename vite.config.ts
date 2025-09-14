import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true
  },
  server: {
    proxy: {
      '/sortly': {
        target: 'https://api.sortly.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/sortly/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const cookie = req.headers['x-proxy-cookie'] as string | undefined
            if (cookie) {
              proxyReq.setHeader('cookie', cookie)
            }
            // Drop the custom header so it isn't forwarded upstream
            proxyReq.removeHeader?.('x-proxy-cookie')
          })
        },
      },
    },
  },
})
