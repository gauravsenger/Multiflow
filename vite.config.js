import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true
  },
  preview: {
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      'multiflow.onrender.com',
      '.onrender.com',
      'localhost',
      '127.0.0.1'
    ]
  }
})

