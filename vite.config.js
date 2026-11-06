import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: true },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
