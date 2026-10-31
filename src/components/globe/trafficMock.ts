import Point from "@arcgis/core/geometry/Point"
import type SceneView from "@arcgis/core/views/SceneView"

import { trafficMockId, useLayerStore } from "../../store/useLayerStore.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"
import { cameraStops } from "./stops.ts"

const jkLandIndex = cameraStops.findIndex((stop) => stop.id === "jk-land")
const laneOffsets = [7]
const trailPixels = 120
const particleCount = 20
const lapSeconds = 18
const metersPerDegreeLat = 110540
const metersPerDegreeLon = 111320 * Math.cos((1.526 * Math.PI) / 180)

const gelangPatah: Array<[number, number]> = [
  [103.645188, 1.525403],
  [103.645315, 1.525504],
  [103.645457, 1.525581],
  [103.645602, 1.525654],
  [103.645754, 1.525709],
  [103.645907, 1.525761],
  [103.646064, 1.525800],
  [103.646222, 1.525835],
  [103.646380, 1.525871],
  [103.646538, 1.525907],
  [103.646685, 1.525973],
  [103.646826, 1.526052],
  [103.646955, 1.526150],
  [103.647074, 1.526260],
  [103.647192, 1.526371],
  [103.647310, 1.526483],
  [103.647430, 1.526591],
  [103.647562, 1.526685],
  [103.647690, 1.526785],
  [103.647828, 1.526870],
  [103.647981, 1.526922],
  [103.648137, 1.526965],
  [103.648294, 1.527002],
  [103.648452, 1.527039],
  [103.648610, 1.527071],
  [103.648769, 1.527102],
  [103.648928, 1.527134],
  [103.649086, 1.527165],
  [103.649245, 1.527197],
  [103.649404, 1.527229],
  [103.649562, 1.527260],
  [103.649721, 1.527292],
  [103.649881, 1.527314],
  [103.650042, 1.527336],
  [103.650203, 1.527337],
  [103.650365, 1.527336],
  [103.650526, 1.527320],
  [103.650684, 1.527286],
  [103.650842, 1.527251],
  [103.650999, 1.527212],
  [103.651156, 1.527173],
  [103.651311, 1.527128],
  [103.651467, 1.527083],
  [103.651622, 1.527038],
  [103.651778, 1.526992],
  [103.651933, 1.526946],
  [103.652088, 1.526900],
  [103.652248, 1.526881],
  [103.652409, 1.526862],
  [103.652570, 1.526844],
  [103.652730, 1.526825],
  [103.652891, 1.526806],
  [103.653052, 1.526787],
  [103.653212, 1.526769],
  [103.653374, 1.526757],
  [103.653535, 1.526746],
  [103.653696, 1.526734],
  [103.653858, 1.526723],
  [103.654019, 1.526711],
  [103.654181, 1.526709],
  [103.654342, 1.526712],
  [103.654503, 1.526732],
  [103.654664, 1.526752],
  [103.654825, 1.526766],
  [103.654986, 1.526778],
  [103.655147, 1.526775],
  [103.655307, 1.526752],
  [103.655462, 1.526706],
  [103.655614, 1.526652],
  [103.655767, 1.526597],
  [103.655925, 1.526563],
  [103.656084, 1.526535],
  [103.656245, 1.526524],
  [103.656407, 1.526517],
  [103.656568, 1.526528],
  [103.656727, 1.526557],
  [103.656883, 1.526599],
  [103.657039, 1.526641],
  [103.657195, 1.526683],
  [103.657348, 1.526736],
  [103.657501, 1.526789],
  [103.657654, 1.526842],
  [103.657807, 1.526895],
  [103.657959, 1.526951],
  [103.658111, 1.527006],
  [103.658267, 1.527050],
  [103.658425, 1.527084],
  [103.658583, 1.527118],
  [103.658742, 1.527148],
  [103.658901, 1.527177],
  [103.659060, 1.527206],
  [103.659220, 1.527235],
  [103.659379, 1.527263],
  [103.659538, 1.527291],
  [103.659698, 1.527319],
  [103.659790, 1.527335],
]

type ScreenPoint = {
  x: number
  y: number
}

type Drifter = {
  along: number
  pace: number
}

const flowStops = [
  { amount: 0, red: 0, green: 128, blue: 255 },
  { amount: 0.5, red: 0, green: 230, blue: 190 },
  { amount: 1, red: 210, green: 255, blue: 70 },
]

export function trafficVisibleForStory(index: number) {
  return index === jkLandIndex
}

export function createTrafficMock(view: SceneView, canvas: HTMLCanvasElement) {
  const eastbound = laneOffsets.map((meters) => offsetLine(gelangPatah, meters))
  const westbound = laneOffsets.map((meters) => offsetLine([...gelangPatah].reverse(), meters))
  const eastboundDrifters = eastbound.map((_, index) => makeDrifters(index / eastbound.length))
  const westboundDrifters = westbound.map((_, index) => makeDrifters(index / westbound.length))
  const probe = new Point({ longitude: 0, latitude: 0 })
  let frame = 0
  let running = false
  let lastTime = 0

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
  }

  function project(path: Array<[number, number]>) {
    const screen: Array<ScreenPoint | null> = []
    for (const [lon, lat] of path) {
      probe.longitude = lon
      probe.latitude = lat
      const hit = view.toScreen(probe)
      if (!hit || hit.x < -140 || hit.y < -140 || hit.x > window.innerWidth + 140 || hit.y > window.innerHeight + 140) {
        pushGap(screen)
        continue
      }
      const previous = lastPoint(screen)
      if (previous) {
        const dx = hit.x - previous.x
        const dy = hit.y - previous.y
        if (dx * dx + dy * dy > 150 * 150) {
          pushGap(screen)
        }
      }
      screen.push({ x: hit.x, y: hit.y })
    }
    return screen
  }

  function draw(time: number) {
    if (!running) {
      return
    }
    const context = canvas.getContext("2d")
    if (!context) {
      frame = window.requestAnimationFrame(draw)
      return
    }
    const dt = Math.min(0.05, lastTime ? (time - lastTime) / 1000 : 0.016)
    lastTime = time
    context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (let index = 0; index < eastbound.length; index += 1) {
      stepDrifters(eastboundDrifters[index], dt)
      stepDrifters(westboundDrifters[index], dt)
      drawFlowLane(context, project(eastbound[index]), eastboundDrifters[index])
      drawFlowLane(context, project(westbound[index]), westboundDrifters[index])
    }
    frame = window.requestAnimationFrame(draw)
  }

  function applyVisible(visible: boolean) {
    canvas.style.opacity = visible ? "1" : "0"
    if (visible && !running) {
      running = true
      resize()
      frame = window.requestAnimationFrame(draw)
      return
    }
    if (!visible && running) {
      running = false
      lastTime = 0
      window.cancelAnimationFrame(frame)
      const context = canvas.getContext("2d")
      context?.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
  }

  function sync() {
    const visible = trafficVisibleForStory(useStoryStore.getState().index)
    const current = useLayerStore.getState().layers.find((item) => item.id === trafficMockId)
    if (current && current.visible !== visible) {
      useLayerStore.getState().setVisible(trafficMockId, visible)
    }
    applyVisible(useLayerStore.getState().layers.find((item) => item.id === trafficMockId)?.visible ?? visible)
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

function offsetLine(line: Array<[number, number]>, meters: number) {
  return line.map((point, index) => {
    const before = line[Math.max(0, index - 1)]
    const after = line[Math.min(line.length - 1, index + 1)]
    const east = (after[0] - before[0]) * metersPerDegreeLon
    const north = (after[1] - before[1]) * metersPerDegreeLat
    const length = Math.hypot(east, north) || 1
    const leftEast = -north / length
    const leftNorth = east / length
    return [
      point[0] + (leftEast * meters) / metersPerDegreeLon,
      point[1] + (leftNorth * meters) / metersPerDegreeLat,
    ] as [number, number]
  })
}

function pushGap(screen: Array<ScreenPoint | null>) {
  if (screen.length > 0 && screen[screen.length - 1] !== null) {
    screen.push(null)
  }
}

function lastPoint(screen: Array<ScreenPoint | null>) {
  for (let index = screen.length - 1; index >= 0; index -= 1) {
    const point = screen[index]
    if (point) {
      return point
    }
  }
  return null
}

function splitRuns(screen: Array<ScreenPoint | null>) {
  const runs: ScreenPoint[][] = []
  let run: ScreenPoint[] = []
  for (const point of screen) {
    if (!point) {
      if (run.length > 1) {
        runs.push(run)
      }
      run = []
      continue
    }
    run.push(point)
  }
  if (run.length > 1) {
    runs.push(run)
  }
  return runs
}

function makeDrifters(phase: number) {
  return Array.from({ length: particleCount }, (_, index) => ({
    along: (index / particleCount + phase * 0.37) % 1,
    pace: 0.72 + ((index * 3 + Math.round(phase * 10)) % 7) * 0.1,
  }))
}

function stepDrifters(drifters: Drifter[], dt: number) {
  for (const drifter of drifters) {
    drifter.along = (drifter.along + (dt / lapSeconds) * drifter.pace) % 1
  }
}

function drawFlowLane(context: CanvasRenderingContext2D, screen: Array<ScreenPoint | null>, drifters: Drifter[]) {
  context.lineCap = "round"
  context.lineJoin = "round"
  context.globalCompositeOperation = "lighter"
  for (const run of splitRuns(screen)) {
    const lengths = [0]
    for (let index = 1; index < run.length; index += 1) {
      lengths.push(lengths[index - 1] + Math.hypot(run[index].x - run[index - 1].x, run[index].y - run[index - 1].y))
    }
    const total = lengths[lengths.length - 1]
    if (total < 12) {
      continue
    }
    context.beginPath()
    context.moveTo(run[0].x, run[0].y)
    for (let index = 1; index < run.length; index += 1) {
      context.lineTo(run[index].x, run[index].y)
    }
    context.lineWidth = 5
    context.strokeStyle = "rgba(0, 140, 255, 0.22)"
    context.stroke()
    for (const drifter of drifters) {
      const magnitude = Math.min(1, Math.max(0, (drifter.pace - 0.72) / 0.6))
      const trail = trailPixels * (0.55 + magnitude * 0.7)
      const head = drifter.along * total
      const tail = Math.max(0, head - trail)
      if (head - tail < 3) {
        continue
      }
      const tailPoint = pointAlong(run, lengths, tail)
      const headPoint = pointAlong(run, lengths, head)
      const paint = context.createLinearGradient(tailPoint.x, tailPoint.y, headPoint.x, headPoint.y)
      paint.addColorStop(0, flowColor(magnitude, 0))
      paint.addColorStop(0.55, flowColor(magnitude, 0.38))
      paint.addColorStop(1, flowColor(magnitude, 0.95))
      traceSpan(context, run, lengths, tail, head)
      context.lineWidth = 2.2 + magnitude * 1.6
      context.strokeStyle = paint
      context.stroke()
    }
  }
  context.globalCompositeOperation = "source-over"
}

function pointAlong(run: ScreenPoint[], lengths: number[], distance: number) {
  const clamped = Math.min(Math.max(distance, 0), lengths[lengths.length - 1])
  for (let index = 1; index < run.length; index += 1) {
    if (lengths[index] < clamped) {
      continue
    }
    const span = lengths[index] - lengths[index - 1] || 1
    const mix = (clamped - lengths[index - 1]) / span
    return {
      x: run[index - 1].x + (run[index].x - run[index - 1].x) * mix,
      y: run[index - 1].y + (run[index].y - run[index - 1].y) * mix,
    }
  }
  return run[run.length - 1]
}

function traceSpan(
  context: CanvasRenderingContext2D,
  run: ScreenPoint[],
  lengths: number[],
  fromDistance: number,
  toDistance: number,
) {
  const start = pointAlong(run, lengths, fromDistance)
  context.beginPath()
  context.moveTo(start.x, start.y)
  for (let index = 1; index < run.length; index += 1) {
    if (lengths[index] <= fromDistance) {
      continue
    }
    if (lengths[index - 1] >= toDistance) {
      break
    }
    if (lengths[index] >= toDistance) {
      const end = pointAlong(run, lengths, toDistance)
      context.lineTo(end.x, end.y)
      break
    }
    context.lineTo(run[index].x, run[index].y)
  }
}

function flowColor(magnitude: number, alpha: number) {
  const amount = Math.min(1, Math.max(0, magnitude))
  let lower = flowStops[0]
  let upper = flowStops[flowStops.length - 1]
  for (let index = 1; index < flowStops.length; index += 1) {
    if (amount <= flowStops[index].amount) {
      lower = flowStops[index - 1]
      upper = flowStops[index]
      break
    }
  }
  const span = upper.amount - lower.amount || 1
  const mix = (amount - lower.amount) / span
  const red = Math.round(lower.red + (upper.red - lower.red) * mix)
  const green = Math.round(lower.green + (upper.green - lower.green) * mix)
  const blue = Math.round(lower.blue + (upper.blue - lower.blue) * mix)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
