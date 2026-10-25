import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      jspdf: path.resolve(__dirname, 'node_modules/jspdf/dist/jspdf.umd.min.js'),
      canvg: path.resolve(__dirname, 'src/utils/canvgStub.js'),
    },
  },
})

