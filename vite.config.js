import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// When VITE_API_URL is set (e.g. in .env.local), API requests are proxied to the Spring Boot
// backend so the browser sees them as same-origin (no CORS needed in dev). Covers both the
// yudao /app-api surface and the legacy /api mock-shaped routes.
// NOTE: .env files populate import.meta.env, NOT process.env — so we must loadEnv() here to
// read VITE_API_URL inside the config.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: apiUrl
        ? {
            '/app-api': { target: apiUrl, changeOrigin: true },
            '/api': { target: apiUrl, changeOrigin: true },
          }
        : undefined,
    },
  }
})
