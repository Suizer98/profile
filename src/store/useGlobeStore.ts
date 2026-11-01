import { create } from "zustand"

export type GlobeCamera = {
  longitude: number
  latitude: number
  altitude: number
  tilt: number
  heading: number
}

export type GlobeVisit = {
  title: string
  summary: string
}

type GlobeState = {
  camera: GlobeCamera | null
  visit: GlobeVisit | null
  setCamera: (camera: GlobeCamera) => void
  setVisit: (visit: GlobeVisit | null) => void
  clearCamera: () => void
  zoomBy: (deltaY: number) => void
  panBy: (dx: number, dy: number) => void
}

const minAltitude = 150
const maxAltitude = 20000000

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function wrapHeading(value: number) {
  return ((value % 360) + 360) % 360
}

function normalizeCamera(camera: GlobeCamera): GlobeCamera {
  return {
    longitude: clamp(camera.longitude, -180, 180),
    latitude: clamp(camera.latitude, -85, 85),
    altitude: clamp(camera.altitude, minAltitude, maxAltitude),
    tilt: clamp(camera.tilt, 0, 80),
    heading: wrapHeading(camera.heading),
  }
}

export const useGlobeStore = create<GlobeState>((set) => ({
  camera: null,
  visit: null,
  setCamera: (camera) => set({ camera: normalizeCamera(camera) }),
  setVisit: (visit) => set({ visit }),
  clearCamera: () => set({ camera: null, visit: null }),
  zoomBy: (deltaY) =>
    set((state) => {
      if (!state.camera) {
        return state
      }
      return {
        camera: normalizeCamera({
          ...state.camera,
          altitude: state.camera.altitude * Math.exp(deltaY * 0.0012),
        }),
      }
    }),
  panBy: (dx, dy) =>
    set((state) => {
      const camera = state.camera
      if (!camera) {
        return state
      }
      const width = window.innerWidth || 1000
      const ground = (camera.altitude * 1.05) / width
      const heading = (camera.heading * Math.PI) / 180
      const east = -dx * ground
      const north = dy * ground
      const rotatedEast = east * Math.cos(heading) - north * Math.sin(heading)
      const rotatedNorth = east * Math.sin(heading) + north * Math.cos(heading)
      const latitude = camera.latitude + rotatedNorth / 111320
      const longitude =
        camera.longitude + rotatedEast / (111320 * Math.cos((camera.latitude * Math.PI) / 180))
      return { camera: normalizeCamera({ ...camera, latitude, longitude }) }
    }),
}))
