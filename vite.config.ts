import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { chatProxy } from "./server/chatProxy.ts"
import { profile } from "./src/profile.ts"

function profileTitle() {
  return {
    name: "profile-title",
    transformIndexHtml(html: string) {
      const title = profile.siteTitle.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      return html.replaceAll("<title>Profile</title>", `<title>${title}</title>`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), chatProxy(), profileTitle()],
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
