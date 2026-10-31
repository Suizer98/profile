import Point from "@arcgis/core/geometry/Point"
import type SceneView from "@arcgis/core/views/SceneView"

import { shadowMockId, useLayerStore } from "../../store/useLayerStore.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"
import { cameraStops } from "./stops.ts"

const nusIndex = cameraStops.findIndex((stop) => stop.id === "nus")
const laneOffsetMeters = 6
const travelSeconds = 1.05
const lightCycleSeconds = 1.35
const movingTrail = 52
const stoppedTrail = 10
const flowStops = [
  { amount: 0, red: 0, green: 128, blue: 255 },
  { amount: 0.5, red: 0, green: 230, blue: 190 },
  { amount: 1, red: 210, green: 255, blue: 70 },
]
const metersPerDegreeLat = 110540
const metersPerDegreeLon = 111320 * Math.cos((1.296 * Math.PI) / 180)

const ridgeRoad: Array<[number, number]> = [
  [103.773597, 1.297378],
  [103.773821, 1.297283],
  [103.773977, 1.297221],
  [103.77417, 1.297223],
  [103.774397, 1.297271],
  [103.774539, 1.297248],
  [103.774738, 1.297075],
  [103.774911, 1.296958],
  [103.775112, 1.296902],
  [103.77522, 1.296858],
  [103.775436, 1.296625],
  [103.775514, 1.296513],
  [103.775619, 1.296366],
  [103.775937, 1.296006],
  [103.776041, 1.295876],
  [103.776133, 1.29574],
  [103.776413, 1.295288],
  [103.776586, 1.295183],
  [103.776786, 1.295159],
  [103.776915, 1.295167],
  [103.777035, 1.295195],
  [103.777189, 1.295204],
  [103.777376, 1.295174],
  [103.777578, 1.295094],
  [103.777713, 1.295006],
  [103.777919, 1.294878],
  [103.778066, 1.294815],
  [103.778294, 1.294822],
  [103.778627, 1.294838],
  [103.779039, 1.29485],
  [103.779289, 1.294818],
  [103.779709, 1.29475],
  [103.779907, 1.294672],
  [103.780098, 1.29448],
  [103.780365, 1.294145],
  [103.780619, 1.293892],
  [103.780926, 1.293654],
  [103.781077, 1.29346],
  [103.781163, 1.293231],
  [103.781252, 1.292979],
  [103.781352, 1.292829],
  [103.781493, 1.292752],
  [103.781906, 1.292619],
  [103.782246, 1.292488],
  [103.782579, 1.292445],
  [103.78283, 1.292359],
  [103.783, 1.292232],
  [103.783127, 1.292027],
  [103.783279, 1.291821],
  [103.783479, 1.291645],
  [103.783598, 1.291526],
]

const crescentRoad: Array<[number, number]> = [
  [103.76957, 1.296146],
  [103.769738, 1.296136],
  [103.769955, 1.296186],
  [103.770147, 1.296241],
  [103.770533, 1.296347],
  [103.770741, 1.296386],
  [103.770939, 1.2964],
  [103.771068, 1.296393],
  [103.771607, 1.296365],
  [103.771778, 1.296373],
  [103.771951, 1.296398],
  [103.772136, 1.296492],
  [103.772222, 1.296559],
  [103.772284, 1.296625],
]

const driveRoad: Array<[number, number]> = [
  [103.774254, 1.292212],
  [103.774071, 1.292286],
  [103.773917, 1.292344],
  [103.773589, 1.292558],
  [103.773479, 1.292676],
  [103.773172, 1.292949],
  [103.772797, 1.293184],
  [103.772576, 1.29329],
  [103.77247, 1.293336],
  [103.77235, 1.29337],
  [103.772184, 1.293409],
  [103.771965, 1.293453],
  [103.771759, 1.293476],
  [103.771597, 1.293505],
  [103.771431, 1.29355],
  [103.771275, 1.293622],
  [103.771147, 1.293698],
  [103.771023, 1.29379],
  [103.770907, 1.293902],
  [103.770752, 1.294105],
  [103.77069, 1.294229],
  [103.770646, 1.294339],
  [103.770612, 1.294453],
  [103.770571, 1.294593],
  [103.770548, 1.294791],
  [103.770558, 1.294957],
  [103.770583, 1.295092],
  [103.770651, 1.295347],
  [103.770734, 1.29551],
  [103.770802, 1.295687],
  [103.770865, 1.295876],
  [103.770889, 1.296055],
  [103.770905, 1.296202],
  [103.770939, 1.2964],
]

const northRoad: Array<[number, number]> = [
  [103.772284, 1.296625],
  [103.77235, 1.296722],
  [103.772429, 1.296825],
  [103.77257, 1.296975],
  [103.772666, 1.2971],
  [103.772791, 1.297265],
  [103.772899, 1.297434],
  [103.772957, 1.297592],
  [103.773, 1.297711],
  [103.773101, 1.297891],
  [103.773197, 1.297999],
  [103.773457, 1.29819],
  [103.773681, 1.298328],
  [103.773845, 1.298448],
  [103.773977, 1.298596],
  [103.774054, 1.298697],
  [103.774142, 1.298819],
  [103.774349, 1.299179],
  [103.774439, 1.299473],
  [103.774522, 1.299797],
  [103.774617, 1.300085],
  [103.774501, 1.300346],
  [103.77434, 1.300598],
  [103.774033, 1.300639],
  [103.773698, 1.300828],
  [103.773431, 1.300962],
  [103.77319, 1.301186],
  [103.772901, 1.301193],
  [103.772524, 1.301118],
]

type ScreenPoint = {
  x: number
  y: number
}

type Axis = "east" | "north"

type Road = {
  line: Array<[number, number]>
  axis: Axis
  signals: number[]
  count: number
}

type Car = {
  along: number
  pace: number
  waiting: boolean
}

const roads: Road[] = [
  { line: ridgeRoad, axis: "east", signals: [0.22, 0.46], count: 28 },
  { line: crescentRoad, axis: "east", signals: [0.5], count: 11 },
  { line: driveRoad, axis: "north", signals: [0.94], count: 16 },
  { line: northRoad, axis: "north", signals: [0.42], count: 16 },
]

export function shadowVisibleForStory(index: number) {
  return index === nusIndex
}

export function createShadowMock(view: SceneView, canvas: HTMLCanvasElement) {
  const lanes = roads.flatMap((road) => [
    { line: offsetLine(road.line, laneOffsetMeters), signals: road.signals, axis: road.axis, cars: makeCars(road.count, 0) },
    {
      line: offsetLine([...road.line].reverse(), laneOffsetMeters),
      signals: road.signals.map((signal) => 1 - signal).sort((left, right) => left - right),
      axis: road.axis,
      cars: makeCars(road.count, 0.17),
    },
  ])
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
  }

  function project(path: Array<[number, number]>) {
    const screen: Array<ScreenPoint | null> = []
    for (const [lon, lat] of path) {
      probe.longitude = lon
      probe.latitude = lat
      let hit: { x: number; y: number } | null = null
      try {
        hit = view.toScreen(probe)
      } catch {
        hit = null
      }
      if (!hit || hit.x < -140 || hit.y < -140 || hit.x > window.innerWidth + 140 || hit.y > window.innerHeight + 140) {
        pushGap(screen)
        continue
      }
      const previous = lastPoint(screen)
      if (previous) {
        const dx = hit.x - previous.x
        const dy = hit.y - previous.y
        if (dx * dx + dy * dy > 180 * 180) {
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
    clock += dt
    const eastOpen = clock % lightCycleSeconds < lightCycleSeconds / 2
    context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const lane of lanes) {
      const open = lane.axis === "east" ? eastOpen : !eastOpen
      stepCars(lane.cars, lane.signals, open, dt)
      drawLane(context, project(lane.line), lane.cars)
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
    const visible = shadowVisibleForStory(useStoryStore.getState().index)
    const current = useLayerStore.getState().layers.find((item) => item.id === shadowMockId)
    if (current && current.visible !== visible) {
      useLayerStore.getState().setVisible(shadowMockId, visible)
    }
    applyVisible(useLayerStore.getState().layers.find((item) => item.id === shadowMockId)?.visible ?? visible)
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

function makeCars(count: number, phase: number) {
  return Array.from({ length: count }, (_, index) => ({
    along: (index / count + phase) % 1,
    pace: 0.84 + (index % 6) * 0.06,
    waiting: false,
  }))
}

function stepCars(cars: Car[], signals: number[], open: boolean, dt: number) {
  const ordered = [...cars].sort((left, right) => right.along - left.along)
  let queued = 0
  for (const car of ordered) {
    const next = signals.find((signal) => signal > car.along + 0.004)
    if (!next || open) {
      car.along = (car.along + (dt / travelSeconds) * car.pace) % 1
      car.waiting = false
      continue
    }
    const stopAt = Math.max(0, next - 0.012 - queued * 0.016)
    const step = (dt / travelSeconds) * car.pace
    if (car.along + step >= stopAt) {
      car.along = stopAt
      car.waiting = true
      queued += 1
      continue
    }
    car.along += step
    car.waiting = false
  }
}

function drawLane(context: CanvasRenderingContext2D, screen: Array<ScreenPoint | null>, cars: Car[]) {
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
    for (const car of cars) {
      const trail = car.waiting ? stoppedTrail : movingTrail
      const head = car.along * total
      const tail = Math.max(0, head - trail)
      if (head - tail < 2) {
        continue
      }
      const magnitude = Math.min(1, car.along * 0.78 + (car.pace - 0.84) * 0.7)
      const tailPoint = pointAlong(run, lengths, tail)
      const headPoint = pointAlong(run, lengths, head)
      const trailPaint = context.createLinearGradient(tailPoint.x, tailPoint.y, headPoint.x, headPoint.y)
      trailPaint.addColorStop(0, flowColor(magnitude, 0))
      trailPaint.addColorStop(0.62, flowColor(magnitude, car.waiting ? 0.28 : 0.45))
      trailPaint.addColorStop(1, flowColor(magnitude, car.waiting ? 0.7 : 0.95))
      traceSpan(context, run, lengths, tail, head)
      context.lineWidth = car.waiting ? 1.6 : 2.2
      context.strokeStyle = trailPaint
      context.stroke()
    }
  }
  context.globalCompositeOperation = "source-over"
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
