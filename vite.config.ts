import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://WELVIA.github.io/report-generator/ に置く前提
export default defineConfig({
  base: '/report-generator/',
  plugins: [react()],
})
