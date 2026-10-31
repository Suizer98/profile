import Graphic from "@arcgis/core/Graphic"
import Point from "@arcgis/core/geometry/Point"
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer"
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer"
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D"
import type SceneView from "@arcgis/core/views/SceneView"

import { satelliteMockId, useLayerStore } from "../../store/useLayerStore.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"

const hideBlend = 0.45
const earthRadius = 6371000

const satelliteSymbol = new PointSymbol3D({
  symbolLayers: [
    new IconSymbol3DLayer({
      resource: { href: "/satellite2.png" },
      size: 52,
      anchor: "center",
    }),
  ],
})

type Orbit = {
  name: string
  altitude: number
  inclination: number
  node: number
  phase: number
  speed: number
  direction: number
}

const orbits: Orbit[] = [
  { name: "G1", altitude: 980000, inclination: 28, node: 96, phase: 0.7, speed: (2 * Math.PI) / 420, direction: 1 },
  { name: "G2", altitude: 1120000, inclination: 55, node: 118, phase: 0.7, speed: (2 * Math.PI) / 500, direction: 1 },
  { name: "G3", altitude: 1280000, inclination: 22, node: 150, phase: 0, speed: (2 * Math.PI) / 380, direction: -1 },
  { name: "G4", altitude: 1420000, inclination: 74, node: 70, phase: 0.52, speed: (2 * Math.PI) / 560, direction: -1 },
  { name: "G5", altitude: 1560000, inclination: 40, node: 80, phase: 0.87, speed: (2 * Math.PI) / 460, direction: 1 },
  { name: "G6", altitude: 1680000, inclination: 16, node: 40, phase: 0.35, speed: (2 * Math.PI) / 400, direction: -1 },
  { name: "G7", altitude: 1820000, inclination: 60, node: 130, phase: 0.17, speed: (2 * Math.PI) / 520, direction: 1 },
  { name: "G8", altitude: 1960000, inclination: 36, node: 20, phase: 1.22, speed: (2 * Math.PI) / 440, direction: -1 },
]

export function satelliteVisibleForStory(index: number, blend: number) {
  return index === 0 && blend < hideBlend
}

export function createSatelliteMockLayer() {
  return new GraphicsLayer({
    id: satelliteMockId,
    title: "Satellite",
    elevationInfo: { mode: "absolute-height" },
    visible: satelliteVisibleForStory(useStoryStore.getState().index, useStoryStore.getState().blend),
  })
}

export function startSatellites(view: SceneView, layer: GraphicsLayer) {
  const graphics = orbits.map(
    (orbit) =>
      new Graphic({
        geometry: satellitePoint(orbit, 0),
        symbol: satelliteSymbol,
        attributes: { name: `Satellite ${orbit.name}`, altitude: orbit.altitude },
      }),
  )
  layer.addMany(graphics)

  let frame = 0
  let running = false
  const started = performance.now()

  function draw(now: number) {
    if (!running) {
      return
    }
    if (layer.graphics.length === 0) {
      layer.addMany(graphics)
    }
    const seconds = (now - started) / 1000
    orbits.forEach((orbit, index) => {
      const graphic = graphics[index]
      const point = satellitePoint(orbit, seconds)
      const longitude = point.longitude
      const latitude = point.latitude
      graphic.geometry = point
      if (longitude == null || latitude == null) {
        graphic.visible = false
        return
      }
      graphic.visible = !behindEarth(view, longitude, latitude, orbit.altitude)
    })
    frame = window.requestAnimationFrame(draw)
  }

  return {
    sync() {
      if (layer.visible && !running) {
        running = true
        frame = window.requestAnimationFrame(draw)
        return
      }
      if (!layer.visible && running) {
        running = false
        window.cancelAnimationFrame(frame)
      }
    },
    remove() {
      running = false
      window.cancelAnimationFrame(frame)
    },
  }
}

export function syncSatelliteVisibility(layer: GraphicsLayer) {
  const { index, blend } = useStoryStore.getState()
  const visible = satelliteVisibleForStory(index, blend)
  const current = useLayerStore.getState().layers.find((item) => item.id === satelliteMockId)
  if (current && current.visible !== visible) {
    useLayerStore.getState().setVisible(satelliteMockId, visible)
  }
  layer.visible = useLayerStore.getState().layers.find((item) => item.id === satelliteMockId)?.visible ?? visible
}

function satellitePoint(orbit: Orbit, seconds: number) {
  const inclination = (orbit.inclination * Math.PI) / 180
  const node = (orbit.node * Math.PI) / 180
  const theta = orbit.phase + orbit.direction * orbit.speed * seconds
  const cosNode = Math.cos(node)
  const sinNode = Math.sin(node)
  const cosTheta = Math.cos(theta)
  const sinTheta = Math.sin(theta)
  const cosInclination = Math.cos(inclination)
  const x = cosNode * cosTheta - sinNode * sinTheta * cosInclination
  const y = sinNode * cosTheta + cosNode * sinTheta * cosInclination
  const z = sinTheta * Math.sin(inclination)
  return new Point({
    longitude: (Math.atan2(y, x) * 180) / Math.PI,
    latitude: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
    z: orbit.altitude,
  })
}

function behindEarth(view: SceneView, longitude: number, latitude: number, altitude: number) {
  const camera = view.camera?.position
  if (!camera || camera.longitude == null || camera.latitude == null) {
    return false
  }
  const cam = toEarth(camera.longitude, camera.latitude, camera.z ?? 0)
  const sat = toEarth(longitude, latitude, altitude)
  const dx = sat.x - cam.x
  const dy = sat.y - cam.y
  const dz = sat.z - cam.z
  const length2 = dx * dx + dy * dy + dz * dz
  if (length2 === 0) {
    return false
  }
  const closest = Math.max(0, Math.min(1, -(cam.x * dx + cam.y * dy + cam.z * dz) / length2))
  if (closest <= 0 || closest >= 1) {
    return false
  }
  const x = cam.x + dx * closest
  const y = cam.y + dy * closest
  const z = cam.z + dz * closest
  return x * x + y * y + z * z < earthRadius * earthRadius
}

function toEarth(longitude: number, latitude: number, altitude: number) {
  const radius = earthRadius + altitude
  const lat = (latitude * Math.PI) / 180
  const lon = (longitude * Math.PI) / 180
  return {
    x: radius * Math.cos(lat) * Math.cos(lon),
    y: radius * Math.cos(lat) * Math.sin(lon),
    z: radius * Math.sin(lat),
  }
}
