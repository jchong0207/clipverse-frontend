import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When VITE_API_URL is set, /api requests are proxied to the Spring Boot backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: process.env.VITE_API_URL
      ? { '/api': { target: process.env.VITE_API_URL, changeOrigin: true } }
      : undefined,
  },
})
