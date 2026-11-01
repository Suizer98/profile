import { cameraStops } from "../components/globe/stops.ts"
import { satelliteMockId, seaMockId, shadowMockId, trafficMockId } from "../store/useLayerStore.ts"

export const defaultGroqModel = "openai/gpt-oss-120b"
export const defaultGeminiModel = "gemini-3.5-flash"
export const defaultGroqBaseUrl = "https://api.groq.com/openai/v1"
export const defaultGeminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai"
export const maxToolRounds = 4
export const maxTokens = 800

const sections = cameraStops.map((stop) => `${stop.id} (${stop.label})`).join(", ")
const layers = [
  `Satellite ${satelliteMockId}`,
  `Sea ${seaMockId}`,
  `Traffic ${trafficMockId}`,
  `Shadow ${shadowMockId}`,
].join(", ")

export const systemPrompt = [
  "You guide visitors on Tey Sui Zer's portfolio globe.",
  "He is a software engineer in Singapore with a geomatics background, now at Esri Singapore.",
  "Answer in a few sentences.",
  "Use goToSection for portfolio chapters.",
  "Use flyTo for any other place on Earth. Pass decimal longitude and latitude.",
  "Altitude is meters above the ground: about 800 for a street, 20000 for a city, 250000 for a region, 2500000 for a country.",
  "After flyTo the visitor can drag to look around. Use rotateView to set heading (degrees clockwise from north) and tilt (0 looks down, 60 is oblique).",
  "Use releaseView to return the globe to the chapter they scrolled to.",
  `Sections: ${sections}.`,
  `Layers: ${layers}.`,
].join(" ")
