import { sampleCamera } from "../components/globe/cameraPath.ts"
import { cameraStops } from "../components/globe/stops.ts"
import { useLayerStore } from "../store/useLayerStore.ts"
import { useStoryStore, type FreeCamera } from "../store/useStoryStore.ts"

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
      description: "Fly the globe to any place on Earth, including places outside the portfolio chapters.",
      parameters: {
        type: "object",
        properties: {
          longitude: { type: "number", description: "Decimal degrees, -180 to 180." },
          latitude: { type: "number", description: "Decimal degrees, -85 to 85." },
          altitude: { type: "number", description: "Meters above the ground." },
          tilt: { type: "number", description: "0 looks straight down. 60 is an oblique view." },
          heading: { type: "number", description: "Degrees clockwise from north." },
          place: { type: "string", description: "Name of the place, for the reply." },
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
      stop.title.toLowerCase() === needle,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function wrapHeading(value: number) {
  return ((value % 360) + 360) % 360
}

function currentView(): FreeCamera {
  const free = useStoryStore.getState().freeCamera
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
  useStoryStore.getState().setFreeCamera(null)
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

export function flyTo(longitude: number, latitude: number, altitude: number, tilt: number, heading: number, place: string): MapActionResult {
  const camera: FreeCamera = {
    longitude: clamp(longitude, -180, 180),
    latitude: clamp(latitude, -85, 85),
    altitude: clamp(altitude, 150, 20000000),
    tilt: clamp(tilt, 0, 80),
    heading: wrapHeading(heading),
  }
  useStoryStore.getState().setFreeCamera(camera)
  const label = place.trim() || `${camera.latitude.toFixed(2)}, ${camera.longitude.toFixed(2)}`
  return {
    ok: true,
    name: "flyTo",
    detail: `Looking at ${label}. The visitor can drag to rotate the view.`,
  }
}

export function rotateView(heading: number | null, tilt: number | null): MapActionResult {
  if (heading === null && tilt === null) {
    return { ok: false, name: "rotateView", detail: "Pass heading, tilt, or both" }
  }
  const base = currentView()
  const camera: FreeCamera = {
    ...base,
    heading: heading === null ? base.heading : wrapHeading(heading),
    tilt: tilt === null ? base.tilt : clamp(tilt, 0, 80),
  }
  useStoryStore.getState().setFreeCamera(camera)
  return {
    ok: true,
    name: "rotateView",
    detail: `Heading ${Math.round(camera.heading)}°, tilt ${Math.round(camera.tilt)}°. The visitor can drag to keep looking around.`,
  }
}

export function releaseView(): MapActionResult {
  useStoryStore.getState().setFreeCamera(null)
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
  const free = useStoryStore.getState().freeCamera
  return {
    ok: true,
    name: "getMapState",
    detail: JSON.stringify({
      section: stop.id,
      label: stop.label,
      freeCamera: free,
      layers,
    }),
  }
}

export function runMapAction(name: string, args: Record<string, unknown>): MapActionResult {
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
      asNumber(args.altitude) ?? 20000,
      asNumber(args.tilt) ?? 55,
      asNumber(args.heading) ?? 0,
      String(args.place ?? ""),
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
