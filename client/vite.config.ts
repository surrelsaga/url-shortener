import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // dev only: requests to /api/... on :5173 are forwarded to Fastify on :3000,
    // so the browser sees one origin and no CORS is needed (D11)
    proxy: { '/api': 'http://localhost:3000' },
  },
})
