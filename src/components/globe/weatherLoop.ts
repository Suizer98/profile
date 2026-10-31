import type SceneView from "@arcgis/core/views/SceneView"

import { useStoryStore } from "../../store/useStoryStore.ts"
import { cameraStops } from "./stops.ts"

const esriIndex = cameraStops.findIndex((stop) => stop.id === "esri")

const rain = { type: "rainy" as const, cloudCover: 0.95, precipitation: 1 }
const clearSky = { type: "sunny" as const, cloudCover: 0.12 }

export function weatherVisibleForStory(index: number) {
  return index === esriIndex
}

export function createWeatherLoop(view: SceneView) {
  let raining = false

  function applyVisible(visible: boolean) {
    if (visible === raining) {
      return
    }
    raining = visible
    view.environment.weather = visible ? rain : clearSky
  }

  function sync() {
    applyVisible(weatherVisibleForStory(useStoryStore.getState().index))
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
