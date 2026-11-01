import type SceneView from "@arcgis/core/views/SceneView"

import { useStoryStore } from "../../store/useStoryStore.ts"
import { sceneIndexes } from "./stops.ts"

const weatherIndexes = new Set(sceneIndexes("weather"))

const rain = { type: "rainy" as const, cloudCover: 0.95, precipitation: 1 }
const clearSky = { type: "sunny" as const, cloudCover: 0.12 }

export function weatherVisibleForStory(index: number) {
  return weatherIndexes.has(index)
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
