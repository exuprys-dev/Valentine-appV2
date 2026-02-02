import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use VITE_BASE env var (set by CI) or default to '/'
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
