import "@arcgis/core/assets/esri/themes/dark/main.css"
import "@mantine/core/styles.css"
import { MantineProvider } from "@mantine/core"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App.tsx"
import "./index.css"
import { profile } from "./profile.ts"
import { theme } from "./theme.ts"
import { syncAppViewport } from "./utils/appViewport.ts"

document.title = profile.siteTitle
syncAppViewport()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
)
