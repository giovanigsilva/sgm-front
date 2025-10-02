import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'testedeploy-5nh7izs9.b4a.run', // 🔹 adicione seu host aqui
    ],
    host: true, // permite conexões externas
    port: 5173, // opcional, default do vite
  },
})
