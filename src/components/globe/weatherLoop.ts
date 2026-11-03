import type SceneView from "@arcgis/core/views/SceneView"

import type { Weather } from "../../profile.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"
import { cameraStops } from "./stops.ts"

const weatherBefore = 0.36
const weatherAfter = 0.9

const clearSky = { type: "sunny" as const, cloudCover: 0.12 }

const weatherPresets = {
  rain: { type: "rainy" as const, cloudCover: 0.95, precipitation: 1 },
  snow: { type: "snowy" as const, cloudCover: 0.85, precipitation: 0.6 },
  fog: { type: "foggy" as const, fogStrength: 0.4 },
  cloudy: { type: "cloudy" as const, cloudCover: 0.75 },
}

function weatherForStory(index: number, blend: number) {
  const position = index + blend
  let chosen: Weather | null = null
  cameraStops.forEach((stop, stopIndex) => {
    if (!stop.weather) {
      return
    }
    if (position >= stopIndex - weatherBefore && position < stopIndex + weatherAfter) {
      chosen = stop.weather
    }
  })
  return chosen
}

export function createWeatherLoop(view: SceneView) {
  let active: Weather | null = null

  function weatherType() {
    const weather = view.environment.weather
    return weather && "type" in weather ? weather.type : ""
  }

  function applyWeather(next: Weather | null) {
    const preset = next ? weatherPresets[next] : clearSky
    if (next === active && weatherType() === preset.type) {
      return
    }
    active = next
    view.environment.weather = { ...preset }
  }

  function sync() {
    const { index, blend } = useStoryStore.getState()
    applyWeather(weatherForStory(index, blend))
  }

  return {
    sync,
    remove() {
      active = null
      view.environment.weather = { ...clearSky }
    },
  }
}
