import { sampleCamera } from "../components/globe/cameraPath.ts"
import { cameraStops } from "../components/globe/stops.ts"
import { useGlobeStore, type GlobeCamera } from "../store/useGlobeStore.ts"
import { useLayerStore } from "../store/useLayerStore.ts"
import { useStoryStore } from "../store/useStoryStore.ts"

const closerVisitAltitude = 4000
const minVisitAltitude = 150
const zoomRequestPattern =
  /\b(zoom(?:ing|ed)?|closer|close-?up|up close|further|farther|overview|aerial|bird'?s?[ -]?eye|street[ -]?level|altitude|pull back|wide view|whole of)\b|\bfrom (?:above|space|far|afar|high|orbit|nearby)\b|\b\d+(?:\.\d+)?\s*(?:km|m|meters?|metres?|kilometers?|kilometres?|miles?)\b|\b(?:whole|entire) (?:city|country|region|island|state|continent)\b|\b(?:city|country|region|neighborhood|neighbourhood|district|campus) (?:view|level|scale)\b/i

export type MapActionResult = {
  ok: boolean
  name: string
  detail: string
}

export const mapToolSchemas = [
  {
    type: "function" as const,
    function: {
      name: "goToSection",
      description: "Scroll the portfolio globe to a section.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Section id, label, or title, such as home, esri, or contact.",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "setLayerVisible",
      description: "Show or hide a globe layer.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Layer id or title: satellite-mock, sea-mock, traffic-mock, shadow-mock.",
          },
          visible: {
            type: "boolean",
            description: "True shows the layer. False hides it.",
          },
        },
        required: ["id", "visible"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "flyTo",
      description:
        "Fly the globe to any place on Earth, including places outside the portfolio chapters. The view zooms closer than the current chapter unless the visitor asks for a zoom or scale.",
      parameters: {
        type: "object",
        properties: {
          longitude: { type: "number", description: "Decimal degrees, -180 to 180." },
          latitude: { type: "number", description: "Decimal degrees, -85 to 85." },
          altitude: {
            type: "number",
            description:
              "Meters above the ground. Omit unless the visitor asks for a zoom, height, distance, or scale.",
          },
          tilt: { type: "number", description: "0 looks straight down. 60 is an oblique view." },
          heading: { type: "number", description: "Degrees clockwise from north." },
          place: { type: "string", description: "Short place name shown large, such as Kyoto." },
          summary: { type: "string", description: "Exactly two sentences about the place." },
        },
        required: ["longitude", "latitude"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "rotateView",
      description: "Turn the free camera. The visitor can also drag to look around after this.",
      parameters: {
        type: "object",
        properties: {
          heading: { type: "number", description: "Degrees clockwise from north." },
          tilt: { type: "number", description: "0 looks straight down. 60 is an oblique view." },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "releaseView",
      description: "Leave the free camera and return to the portfolio chapter.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getMapState",
      description: "Read the current section and which layers are visible.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
]

function findStop(id: string) {
  const needle = id.trim().toLowerCase()
  return cameraStops.find(
    (stop) =>
      stop.id.toLowerCase() === needle ||
      stop.label.toLowerCase() === needle ||
      stop.title.toLowerCase() === needle ||
      stop.aliases.some((alias) => alias.toLowerCase() === needle),
  )
}

function findLayer(id: string) {
  const needle = id.trim().toLowerCase()
  return useLayerStore.getState().layers.find(
    (layer) => layer.id.toLowerCase() === needle || layer.title.toLowerCase() === needle,
  )
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }
  if (value === "true") {
    return true
  }
  if (value === "false") {
    return false
  }
  return null
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

function visitorSpecifiedZoom(request: string) {
  return zoomRequestPattern.test(request)
}

function closerAltitude(current: number) {
  if (current > closerVisitAltitude) {
    return closerVisitAltitude
  }
  return Math.max(minVisitAltitude, current)
}

function flyAltitude(value: unknown, request: string) {
  const requested = asNumber(value)
  if (requested !== null && visitorSpecifiedZoom(request)) {
    return requested
  }
  return closerAltitude(currentView().altitude)
}

function currentView(): GlobeCamera {
  const free = useGlobeStore.getState().camera
  if (free) {
    return free
  }
  const { index, blend } = useStoryStore.getState()
  const sampled = sampleCamera(index, blend)
  return {
    longitude: sampled.longitude,
    latitude: sampled.latitude,
    altitude: sampled.altitude,
    tilt: sampled.tilt,
    heading: sampled.heading,
  }
}

export function goToSection(id: string): MapActionResult {
  const stop = findStop(id)
  if (!stop) {
    return { ok: false, name: "goToSection", detail: `Unknown section ${id}` }
  }
  const section = document.querySelector<HTMLElement>(`[data-stop="${stop.id}"]`)
  if (!section) {
    return { ok: false, name: "goToSection", detail: `Section ${stop.id} is not on the page` }
  }
  useGlobeStore.getState().clearCamera()
  window.scrollTo({ top: section.offsetTop, behavior: "smooth" })
  return { ok: true, name: "goToSection", detail: `Moved to ${stop.label}` }
}

export function setLayerVisible(id: string, visible: boolean): MapActionResult {
  const layer = findLayer(id)
  if (!layer) {
    return { ok: false, name: "setLayerVisible", detail: `Unknown layer ${id}` }
  }
  useLayerStore.getState().setVisible(layer.id, visible)
  return {
    ok: true,
    name: "setLayerVisible",
    detail: `${layer.title} is ${visible ? "visible" : "hidden"}`,
  }
}

export function flyTo(longitude: number, latitude: number, altitude: number, tilt: number, heading: number, place: string, summary: string): MapActionResult {
  const camera: GlobeCamera = {
    longitude,
    latitude,
    altitude,
    tilt,
    heading,
  }
  const label = place.trim() || `${camera.latitude.toFixed(2)}, ${camera.longitude.toFixed(2)}`
  useGlobeStore.getState().setCamera(camera)
  useGlobeStore.getState().setVisit({ title: label, summary: summary.trim() })
  return {
    ok: true,
    name: "flyTo",
    detail: `Looking at ${label}. Drag to rotate, right-drag or a second finger to pan, scroll or pinch to zoom. The chapter stays put.`,
  }
}

export function rotateView(heading: number | null, tilt: number | null): MapActionResult {
  if (heading === null && tilt === null) {
    return { ok: false, name: "rotateView", detail: "Pass heading, tilt, or both" }
  }
  const base = currentView()
  const camera: GlobeCamera = {
    ...base,
    heading: heading === null ? base.heading : heading,
    tilt: tilt === null ? base.tilt : tilt,
  }
  useGlobeStore.getState().setCamera(camera)
  return {
    ok: true,
    name: "rotateView",
    detail: `Heading ${Math.round(camera.heading)}°, tilt ${Math.round(camera.tilt)}°. The visitor can drag to keep looking around.`,
  }
}

export function releaseView(): MapActionResult {
  useGlobeStore.getState().clearCamera()
  return { ok: true, name: "releaseView", detail: "Returned to the current chapter" }
}

export function getMapState(): MapActionResult {
  const { index, blend } = useStoryStore.getState()
  const activeIndex = Math.min(cameraStops.length - 1, Math.max(0, Math.round(index + blend)))
  const stop = cameraStops[activeIndex]
  const layers = useLayerStore.getState().layers.map((layer) => ({
    id: layer.id,
    title: layer.title,
    visible: layer.visible,
  }))
  const camera = useGlobeStore.getState().camera
  return {
    ok: true,
    name: "getMapState",
    detail: JSON.stringify({
      section: stop.id,
      label: stop.label,
      camera,
      layers,
    }),
  }
}

export function runMapAction(name: string, args: Record<string, unknown>, request = ""): MapActionResult {
  if (name === "goToSection") {
    return goToSection(String(args.id ?? ""))
  }
  if (name === "flyTo") {
    const longitude = asNumber(args.longitude)
    const latitude = asNumber(args.latitude)
    if (longitude === null || latitude === null) {
      return { ok: false, name, detail: "longitude and latitude are required" }
    }
    return flyTo(
      longitude,
      latitude,
      flyAltitude(args.altitude, request),
      asNumber(args.tilt) ?? 55,
      asNumber(args.heading) ?? 0,
      String(args.place ?? ""),
      String(args.summary ?? ""),
    )
  }
  if (name === "rotateView") {
    return rotateView(asNumber(args.heading), asNumber(args.tilt))
  }
  if (name === "releaseView") {
    return releaseView()
  }
  if (name === "setLayerVisible") {
    const visible = asBoolean(args.visible)
    if (visible === null) {
      return { ok: false, name, detail: "visible must be true or false" }
    }
    return setLayerVisible(String(args.id ?? ""), visible)
  }
  if (name === "getMapState") {
    return getMapState()
  }
  return { ok: false, name, detail: `Unknown action ${name}` }
}
