import type SceneView from "@arcgis/core/views/SceneView"

import { useStoryStore } from "../../store/useStoryStore.ts"
import { cameraStops } from "./stops.ts"

const esriIndex = cameraStops.findIndex((stop) => stop.id === "esri")
const stepSeconds = 1.15

const steps = [
  { type: "sunny" as const, cloudCover: 0.04 },
  { type: "cloudy" as const, cloudCover: 0.95 },
  { type: "rainy" as const, cloudCover: 0.95, precipitation: 1 },
  { type: "foggy" as const, fogStrength: 0.82 },
]

const clearSky = { type: "sunny" as const, cloudCover: 0.12 }

export function weatherVisibleForStory(index: number) {
  return index === esriIndex
}

export function createWeatherLoop(view: SceneView) {
  let frame = 0
  let running = false
  let lastTime = 0
  let clock = 0
  let shown = -1

  function draw(time: number) {
    if (!running) {
      return
    }
    const dt = Math.min(0.05, lastTime ? (time - lastTime) / 1000 : 0.016)
    lastTime = time
    clock += dt
    const index = Math.floor(clock / stepSeconds) % steps.length
    if (index !== shown) {
      shown = index
      view.environment.weather = steps[index]
    }
    frame = window.requestAnimationFrame(draw)
  }

  function applyVisible(visible: boolean) {
    if (visible && !running) {
      running = true
      clock = 0
      lastTime = 0
      shown = -1
      frame = window.requestAnimationFrame(draw)
      return
    }
    if (!visible && running) {
      running = false
      shown = -1
      window.cancelAnimationFrame(frame)
      view.environment.weather = clearSky
    }
  }

  function sync() {
    applyVisible(weatherVisibleForStory(useStoryStore.getState().index))
  }

  return {
    sync,
    applyVisible,
    remove() {
      running = false
      window.cancelAnimationFrame(frame)
      view.environment.weather = clearSky
    },
  }
}
