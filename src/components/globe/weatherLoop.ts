import type SceneView from "@arcgis/core/views/SceneView"

import { useStoryStore } from "../../store/useStoryStore.ts"
import { atWorkplace, holdingAtWorkplace } from "./cameraPath.ts"
import { sceneIndexes } from "./stops.ts"

const weatherIndexes = new Set(sceneIndexes("weather"))

const rain = { type: "rainy" as const, cloudCover: 0.95, precipitation: 1 }
const clearSky = { type: "sunny" as const, cloudCover: 0.12 }

export function weatherVisibleForStory(index: number, blend: number) {
  if (!weatherIndexes.has(index)) {
    return false
  }
  if (atWorkplace(index)) {
    return holdingAtWorkplace(index, blend)
  }
  return blend < 1
}

export function createWeatherLoop(view: SceneView) {
  let raining = false

  function weatherType() {
    const weather = view.environment.weather
    return weather && "type" in weather ? weather.type : ""
  }

  function applyVisible(visible: boolean) {
    const type = weatherType()
    if (visible) {
      if (raining && type === "rainy") {
        return
      }
      raining = true
      view.environment.weather = rain
      return
    }
    if (!raining && type === "sunny") {
      return
    }
    raining = false
    view.environment.weather = { ...clearSky }
  }

  function sync() {
    const { index, blend } = useStoryStore.getState()
    applyVisible(weatherVisibleForStory(index, blend))
  }

  return {
    sync,
    applyVisible,
    remove() {
      raining = false
      view.environment.weather = clearSky
    },
  }
}
