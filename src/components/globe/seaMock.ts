import Point from "@arcgis/core/geometry/Point"
import type SceneView from "@arcgis/core/views/SceneView"

import { seaMockId, useLayerStore } from "../../store/useLayerStore.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"
import oceanMaskData from "./data/oceanMask.json"
import seaFlowData from "./data/seaFlow.json"
import { cameraStops } from "./stops.ts"

const aboutIndex = cameraStops.findIndex((stop) => stop.id === "about")
const skillsIndex = cameraStops.findIndex((stop) => stop.id === "skills")
const particleCount = 460
const shipCount = 6
const hourSeconds = 1.7

type SeaFlow = {
  times: string[]
  lons: number[]
  lats: number[]
  windU: Array<number | null>
  windV: Array<number | null>
  currentU: Array<number | null>
  currentV: Array<number | null>
}

type Flow = {
  east: number
  north: number
  speed: number
}

type OceanMask = {
  lonStart: number
  latStart: number
  step: number
  columns: number
  rows: number
  runs: number[][]
}

type Drifter = {
  lon: number
  lat: number
  age: number
  life: number
}

const seaFlow = seaFlowData as SeaFlow
const oceanMask = oceanMaskData as OceanMask
const lonCount = seaFlow.lons.length
const latCount = seaFlow.lats.length
const hourCount = seaFlow.times.length
const lonStep = seaFlow.lons[1] - seaFlow.lons[0]
const latStep = seaFlow.lats[1] - seaFlow.lats[0]

export function seaVisibleForStory(index: number) {
  return index >= aboutIndex && index <= skillsIndex
}

export function seaMobileLongitude(altitude: number) {
  if (window.innerWidth >= 768) {
    return 0
  }
  const halfAngle = (13.5 * Math.PI) / 180
  const spanDegrees = (altitude * Math.tan(halfAngle) * 2) / 111320
  return -spanDegrees * 0.28
}

export function createSeaMock(view: SceneView, canvas: HTMLCanvasElement) {
  const particles = Array.from({ length: particleCount }, () => makeDrifter(false))
  const ships = Array.from({ length: shipCount }, () => makeDrifter(true))
  const probe = new Point({ longitude: 0, latitude: 0 })
  let frame = 0
  let running = false
  let lastTime = 0
  let clock = 0

  function resize() {
    const ratio = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const context = canvas.getContext("2d")
    context?.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (width < 768 && running) {
      for (const particle of particles) {
        place(particle, false)
      }
      for (const ship of ships) {
        place(ship, true)
      }
    }
  }

  function project(lon: number, lat: number) {
    probe.longitude = lon
    probe.latitude = lat
    let screen: { x: number; y: number } | null = null
    try {
      screen = view.toScreen(probe)
    } catch {
      return null
    }
    if (!screen) {
      return null
    }
    if (screen.x < -30 || screen.y < -30 || screen.x > window.innerWidth + 30 || screen.y > window.innerHeight + 30) {
      return null
    }
    return { x: screen.x, y: screen.y }
  }

  function place(drifter: Drifter, ship: boolean) {
    const position = view.camera?.position
    const span = Math.min(3.4, Math.max(0.7, (position?.z ?? 180000) / 62000))
    const originLon = position?.longitude ?? 104.2
    const originLat = position?.latitude ?? 1.1
    const narrow = window.innerWidth < 768
    const focusX = window.innerWidth * 0.5
    const focusY = window.innerHeight * (narrow ? 0.3 : 0.48)
    let best: { lon: number; lat: number; score: number } | null = null
    const attempts = narrow ? 28 : 12
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const shiftLon = narrow ? span * 0.08 : span * 0.28
      const shiftLat = narrow ? span * 0.34 : span * 0.22
      const lon = originLon + shiftLon + (Math.random() - 0.5) * span * (narrow ? 0.7 : 1)
      const lat = originLat + shiftLat + (Math.random() - 0.5) * span * (narrow ? 0.55 : 0.85)
      const flow = sampleFlow(ship ? "current" : "wind", lon, lat, clock)
      const sea = ship ? flow : sampleFlow("current", lon, lat, clock)
      const screen = project(lon, lat)
      if (!flow || !sea || (ship && !isOcean(lon, lat)) || !screen) {
        continue
      }
      const dx = (screen.x - focusX) / window.innerWidth
      const dy = (screen.y - focusY) / window.innerHeight
      const score = dx * dx + dy * dy
      if (!narrow) {
        drifter.lon = lon
        drifter.lat = lat
        drifter.age = Math.random() * 1.5
        drifter.life = ship ? 26 + Math.random() * 16 : 5 + Math.random() * 5
        return
      }
      if (!best || score < best.score) {
        best = { lon, lat, score }
      }
      if (score < 0.045) {
        break
      }
    }
    if (!best) {
      return
    }
    drifter.lon = best.lon
    drifter.lat = best.lat
    drifter.age = Math.random() * 1.5
    drifter.life = ship ? 26 + Math.random() * 16 : 5 + Math.random() * 5
  }

  function step(drifter: Drifter, ship: boolean, dt: number, cycle: number) {
    drifter.age += dt
    if (drifter.age > drifter.life) {
      place(drifter, ship)
      return null
    }
    const flow = sampleFlow(ship ? "current" : "wind", drifter.lon, drifter.lat, cycle)
    const sea = ship ? flow : sampleFlow("current", drifter.lon, drifter.lat, cycle)
    const before = project(drifter.lon, drifter.lat)
    if (!flow || !sea || !before || (ship && !isOcean(drifter.lon, drifter.lat))) {
      place(drifter, ship)
      return null
    }
    const altitude = view.camera?.position?.z ?? 180000
    const zoom = Math.min(1.25, Math.max(0.38, altitude / 180000))
    if (ship) {
      const length = Math.hypot(flow.east, flow.north) || 1
      const pace = 0.02 * zoom
      drifter.lon += (flow.east / length) * pace * dt
      drifter.lat += (flow.north / length) * pace * dt
    } else {
      const pace = 0.0044 * zoom
      drifter.lon += flow.east * pace * dt
      drifter.lat += flow.north * pace * dt
    }
    const after = project(drifter.lon, drifter.lat)
    if (!after || (ship && !isOcean(drifter.lon, drifter.lat))) {
      place(drifter, ship)
      return null
    }
    const dx = after.x - before.x
    const dy = after.y - before.y
    if (dx * dx + dy * dy > 34 * 34) {
      place(drifter, ship)
      return null
    }
    if (window.innerWidth < 768 && after.y > window.innerHeight * 0.5) {
      place(drifter, ship)
      return null
    }
    return { before, after, speed: flow.speed }
  }

  function draw(time: number) {
    if (!running) {
      return
    }
    const dt = Math.min(0.05, lastTime ? (time - lastTime) / 1000 : 0.016)
    lastTime = time
    clock += dt
    const context = canvas.getContext("2d")
    if (!context) {
      frame = window.requestAnimationFrame(draw)
      return
    }
    const cycle = (clock / hourSeconds) % hourCount
    context.globalCompositeOperation = "destination-in"
    context.fillStyle = "rgba(0, 0, 0, 0.965)"
    context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    context.globalCompositeOperation = "source-over"
    context.lineCap = "round"
    context.lineWidth = 1.15
    for (const particle of particles) {
      const moved = step(particle, false, dt, cycle)
      if (!moved) {
        continue
      }
      context.strokeStyle = windColor(moved.speed)
      context.beginPath()
      context.moveTo(moved.before.x, moved.before.y)
      context.lineTo(moved.after.x, moved.after.y)
      context.stroke()
    }
    for (const ship of ships) {
      const moved = step(ship, true, dt, cycle)
      if (!moved) {
        continue
      }
      drawShip(context, moved.before.x, moved.before.y, moved.after.x, moved.after.y)
    }
    frame = window.requestAnimationFrame(draw)
  }

  function applyVisible(visible: boolean) {
    canvas.style.opacity = visible ? "1" : "0"
    if (visible && !running) {
      running = true
      lastTime = 0
      resize()
      for (const particle of particles) {
        place(particle, false)
      }
      for (const ship of ships) {
        place(ship, true)
      }
      frame = window.requestAnimationFrame(draw)
      return
    }
    if (!visible && running) {
      running = false
      window.cancelAnimationFrame(frame)
      const context = canvas.getContext("2d")
      context?.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
  }

  function sync() {
    const visible = seaVisibleForStory(useStoryStore.getState().index)
    const current = useLayerStore.getState().layers.find((item) => item.id === seaMockId)
    if (current && current.visible !== visible) {
      useLayerStore.getState().setVisible(seaMockId, visible)
    }
    applyVisible(useLayerStore.getState().layers.find((item) => item.id === seaMockId)?.visible ?? visible)
  }

  window.addEventListener("resize", resize)

  return {
    sync,
    applyVisible,
    remove() {
      running = false
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    },
  }
}

function makeDrifter(ship: boolean): Drifter {
  return {
    lon: 104.5,
    lat: 1,
    age: 0,
    life: ship ? 30 : 6,
  }
}

function isOcean(lon: number, lat: number) {
  const column = Math.floor((lon - oceanMask.lonStart) / oceanMask.step + 0.5)
  const row = Math.floor((lat - oceanMask.latStart) / oceanMask.step + 0.5)
  if (column < 0 || row < 0 || column >= oceanMask.columns || row >= oceanMask.rows) {
    return false
  }
  let start = 0
  let land = false
  for (const run of oceanMask.runs[row]) {
    if (column < start + run) {
      return !land
    }
    start += run
    land = !land
  }
  return false
}

function sampleFlow(field: "wind" | "current", lon: number, lat: number, cycle: number): Flow | null {
  const wrapped = ((cycle % hourCount) + hourCount) % hourCount
  const hour = Math.floor(wrapped) % hourCount
  const nextHour = (hour + 1) % hourCount
  const blend = wrapped - Math.floor(wrapped)
  const now = sampleHour(field, lon, lat, hour)
  const next = sampleHour(field, lon, lat, nextHour)
  if (!now || !next) {
    return now
  }
  const east = now.east + (next.east - now.east) * blend
  const north = now.north + (next.north - now.north) * blend
  return { east, north, speed: Math.hypot(east, north) }
}

function sampleHour(field: "wind" | "current", lon: number, lat: number, hour: number): Flow | null {
  const x = (lon - seaFlow.lons[0]) / lonStep
  const y = (lat - seaFlow.lats[0]) / latStep
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  if (x0 < 0 || y0 < 0 || x0 >= lonCount - 1 || y0 >= latCount - 1) {
    return null
  }
  const tx = x - x0
  const ty = y - y0
  const eastField = field === "wind" ? seaFlow.windU : seaFlow.currentU
  const northField = field === "wind" ? seaFlow.windV : seaFlow.currentV
  const corners = [
    [x0, y0, (1 - tx) * (1 - ty)],
    [x0 + 1, y0, tx * (1 - ty)],
    [x0, y0 + 1, (1 - tx) * ty],
    [x0 + 1, y0 + 1, tx * ty],
  ] as const
  let east = 0
  let north = 0
  for (const [lonIndex, latIndex, weight] of corners) {
    const offset = (hour * latCount + latIndex) * lonCount + lonIndex
    const eastValue = eastField[offset]
    const northValue = northField[offset]
    if (eastValue == null || northValue == null) {
      return null
    }
    east += eastValue * weight
    north += northValue * weight
  }
  return { east, north, speed: Math.hypot(east, north) }
}

function windColor(speed: number) {
  const amount = Math.min(1, speed / 22)
  const red = Math.round(86 + 150 * amount)
  const green = Math.round(176 + 64 * amount)
  const blue = Math.round(196 + 48 * amount)
  const alpha = 0.34 + 0.4 * amount
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function drawShip(
  context: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX)
  context.save()
  context.translate(toX, toY)
  context.rotate(angle)
  context.fillStyle = "rgba(255, 255, 255, 0.9)"
  context.beginPath()
  context.moveTo(7, 0)
  context.lineTo(-5, 3.2)
  context.lineTo(-2.4, 0)
  context.lineTo(-5, -3.2)
  context.closePath()
  context.fill()
  context.restore()
}
