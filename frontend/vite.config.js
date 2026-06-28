import { defineConfig } from 'vite'
import react from '@vitejs/react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } }
})
