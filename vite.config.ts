import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { chatProxy } from "./server/chatProxy.ts"

export default defineConfig({
  plugins: [react(), tailwindcss(), chatProxy()],
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: [process.cwd(), "/usr/local/node_modules"],
    },
  },
  optimizeDeps: {
    exclude: ["@arcgis/core"],
  },
})
