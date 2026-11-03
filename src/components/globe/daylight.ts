import type TileLayer from "@arcgis/core/layers/TileLayer"

import { useStoryStore } from "../../store/useStoryStore.ts"

export const nightLightsUrl =
  "https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_2016/MapServer"

export function daylightAmount(index: number, blend: number) {
  if (index > 0) {
    return 1
  }
  const travel = Math.min(1, Math.max(0, blend))
  return travel * travel * (3 - 2 * travel)
}

export function syncDaylight(nightLights: TileLayer) {
  const { index, blend } = useStoryStore.getState()
  const opacity = 1 - daylightAmount(index, blend)
  nightLights.opacity = opacity
  nightLights.visible = opacity > 0.02
}
