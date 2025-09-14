import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true
  },
  // Note: For local dev you can uncomment proxy if you run a local proxy.
  // server: {
  //   proxy: {
  //     '/sortly': {
  //       target: 'https://api.sortly.com',
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/sortly/, ''),
  //     },
  //   },
  // },
})

