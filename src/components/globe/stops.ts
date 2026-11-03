import { profile, type Chapter, type Scene, type Weather } from "../../profile.ts"

export type CameraStop = {
  id: string
  label: string
  kicker: string
  title: string
  detail: string
  longitude: number
  latitude: number
  altitude: number
  tilt: number
  heading: number
  orbit: boolean
  depart: "linear" | "descent" | "ground" | "dive"
  scene: Scene | null
  weather: Weather | null
  aliases: string[]
}

function stopDetail(chapter: Chapter) {
  if (chapter.kind === "about") {
    return chapter.paragraphs[0] ?? ""
  }
  return chapter.detail
}

const seenIds = new Set<string>()
for (const chapter of profile.chapters) {
  if (seenIds.has(chapter.id)) {
    throw new Error(`Duplicate profile chapter id ${chapter.id}`)
  }
  seenIds.add(chapter.id)
}

if (profile.chapters.length === 0) {
  throw new Error("Profile needs at least one chapter")
}

export const cameraStops: CameraStop[] = profile.chapters.map((chapter) => ({
  id: chapter.id,
  label: chapter.label,
  kicker: chapter.kicker,
  title: chapter.title,
  detail: stopDetail(chapter),
  longitude: chapter.camera.longitude,
  latitude: chapter.camera.latitude,
  altitude: chapter.camera.altitude,
  tilt: chapter.camera.tilt,
  heading: chapter.camera.heading,
  orbit: Boolean(chapter.orbit),
  depart: chapter.depart ?? "linear",
  scene: chapter.scene ?? null,
  weather: chapter.scene === "weather" ? (chapter.weather ?? "rain") : null,
  aliases: chapter.aliases ?? [],
}))

export function sceneIndexes(scene: Scene) {
  return cameraStops.flatMap((stop, index) => (stop.scene === scene ? [index] : []))
}
