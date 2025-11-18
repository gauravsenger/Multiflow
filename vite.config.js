import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Get additional allowed hosts from environment variable
const additionalHosts = process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS
  ? process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS.split(',')
  : []

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    allowedHosts: [
      'multiflow.onrender.com',
      '.onrender.com',
      'localhost',
      '127.0.0.1',
      ...additionalHosts
    ]
  },
  preview: {
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: 'all'
  }
})

