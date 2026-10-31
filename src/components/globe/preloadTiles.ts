import TileLayer from "@arcgis/core/layers/TileLayer"

import { sampleCamera, type SampledCamera } from "./cameraPath.ts"
import { cameraStops } from "./stops.ts"

const tileSize = 256
const originX = -20037508.342787
const originY = 20037508.342787
const level0Resolution = 156543.03392800014
const maxConcurrent = 4
const maxRadiusTiles = 2

const seen = new Set<string>()
const pending: string[] = []
let running = 0
let generation = 0

function lonLatToMercator(longitude: number, latitude: number) {
  const clamped = Math.min(85, Math.max(-85, latitude))
  const x = (longitude * originY) / 180
  const radians = (clamped * Math.PI) / 180
  const y = Math.log(Math.tan(Math.PI / 4 + radians / 2)) * (originY / Math.PI)
  return { x, y }
}

function levelForAltitude(altitude: number) {
  const targetResolution = Math.max(altitude / 1100, 0.4)
  const level = Math.round(Math.log2(level0Resolution / targetResolution))
  return Math.min(19, Math.max(1, level))
}

function lookCenter(camera: SampledCamera) {
  const tiltRadians = (camera.tilt * Math.PI) / 180
  const distance = Math.min(camera.altitude * Math.tan(tiltRadians), 3500000)
  const headingRadians = (camera.heading * Math.PI) / 180
  const north = distance * Math.cos(headingRadians)
  const east = distance * Math.sin(headingRadians)
  const latitude = camera.latitude + north / 111320
  const longitude = camera.longitude + east / (111320 * Math.cos((camera.latitude * Math.PI) / 180))
  return { longitude, latitude, distance }
}

function tileUrls(root: string, camera: SampledCamera) {
  const level = levelForAltitude(camera.altitude)
  const resolution = level0Resolution / 2 ** level
  const span = tileSize * resolution
  const center = lookCenter(camera)
  const mercator = lonLatToMercator(center.longitude, center.latitude)
  const column = Math.floor((mercator.x - originX) / span)
  const row = Math.floor((originY - mercator.y) / span)
  const radius = Math.min(maxRadiusTiles, Math.max(1, Math.ceil(center.distance / span / 2)))
  const limit = 2 ** level
  const urls: string[] = []

  for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
    for (let columnOffset = -radius; columnOffset <= radius; columnOffset += 1) {
      const tileRow = row + rowOffset
      const tileColumn = column + columnOffset
      if (tileRow < 0 || tileColumn < 0 || tileRow >= limit || tileColumn >= limit) {
        continue
      }
      urls.push(`${root}/tile/${level}/${tileRow}/${tileColumn}`)
    }
  }

  return urls
}

function camerasAhead(startIndex: number) {
  const cameras: SampledCamera[] = []
  for (let index = startIndex; index < cameraStops.length; index += 1) {
    cameras.push(sampleCamera(index, 0))
    if (index < cameraStops.length - 1) {
      cameras.push(sampleCamera(index, 0.75))
    }
  }
  return cameras
}

function pump(token: number) {
  if (token !== generation) {
    return
  }
  while (running < maxConcurrent && pending.length > 0) {
    const url = pending.shift()
    if (!url || seen.has(url)) {
      continue
    }
    seen.add(url)
    running += 1
    fetch(url, { mode: "cors", credentials: "omit" })
      .then((response) => response.arrayBuffer())
      .catch(() => undefined)
      .finally(() => {
        running -= 1
        pump(token)
      })
  }
}

function enqueue(urls: string[], front: boolean, token: number) {
  const fresh = urls.filter((url) => !seen.has(url) && !pending.includes(url))
  if (fresh.length === 0) {
    return
  }
  if (front) {
    pending.unshift(...fresh)
  } else {
    pending.push(...fresh)
  }
  pump(token)
}

export function preloadImagery(layer: TileLayer, startIndex: number) {
  const root = layer.url?.replace(/\/$/, "").replace("://services.", "://server.")
  if (!root) {
    return
  }
  const token = generation
  const cameras = camerasAhead(startIndex)
  const urls = cameras.flatMap((camera) => tileUrls(root, camera))
  const upcoming = new Set(urls)
  const rest = pending.filter((url) => !upcoming.has(url))
  pending.length = 0
  pending.push(...rest)
  enqueue(urls, true, token)
}

export function stopPreload() {
  generation += 1
  pending.length = 0
}
