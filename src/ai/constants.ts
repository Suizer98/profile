import { cameraStops } from "../components/globe/stops.ts"
import { profile, type Chapter } from "../profile.ts"
import { satelliteMockId, seaMockId, shadowMockId, trafficMockId } from "../store/useLayerStore.ts"

export const defaultGroqModel = "openai/gpt-oss-120b"
export const defaultGeminiModel = "gemini-3.5-flash"
export const defaultGroqBaseUrl = "https://api.groq.com/openai/v1"
export const defaultGeminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai"
export const maxToolRounds = 4
export const maxTokens = 2000

const skillNames: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  python: "Python",
  cs: "C#",
  css: "CSS",
  html: "HTML",
  matlab: "MATLAB",
  go: "Go",
  octave: "Octave",
  r: "R",
  kotlin: "Kotlin",
  cpp: "C++",
  c: "C",
  react: "React",
  svelte: "Svelte",
  nextjs: "Next.js",
  redux: "Redux",
  tailwind: "Tailwind",
  vite: "Vite",
  bun: "Bun",
  npm: "npm",
  yarn: "Yarn",
  qt: "Qt",
  svg: "SVG",
  django: "Django",
  fastapi: "FastAPI",
  flask: "Flask",
  redis: "Redis",
  prisma: "Prisma",
  selenium: "Selenium",
  dotnet: ".NET",
  vitest: "Vitest",
  jest: "Jest",
  docker: "Docker",
  aws: "AWS",
  azure: "Azure",
  gitlab: "GitLab",
  githubactions: "GitHub Actions",
  ansible: "Ansible",
  nginx: "Nginx",
  gcp: "GCP",
  kubernetes: "Kubernetes",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  sqlite: "SQLite",
  redhat: "Red Hat",
  windows: "Windows",
  ubuntu: "Ubuntu",
  apple: "macOS",
  linux: "Linux",
  bash: "Bash",
  powershell: "PowerShell",
  vscode: "VS Code",
  sublime: "Sublime Text",
  pycharm: "PyCharm",
  vim: "Vim",
  visualstudio: "Visual Studio",
  git: "Git",
  github: "GitHub",
  netlify: "Netlify",
  vercel: "Vercel",
  heroku: "Heroku",
  anaconda: "Anaconda",
  grafana: "Grafana",
  cmake: "CMake",
  postman: "Postman",
  md: "Markdown",
  notion: "Notion",
  autocad: "AutoCAD",
  sketchup: "SketchUp",
}

function skillLine(groups: { title: string; icons: string[] }[]) {
  return groups
    .map((group) => {
      const names = group.icons.map((icon) => skillNames[icon] ?? icon)
      return `${group.title} (${names.length}): ${names.join(", ")}`
    })
    .join("\n")
}

function chapterFacts(chapter: Chapter) {
  if (chapter.kind === "about") {
    return `About:\n${chapter.paragraphs.join("\n")}`
  }
  if (chapter.kind === "skills") {
    return `Skills:\n${skillLine(chapter.groups)}`
  }
  if (chapter.kind === "notes") {
    const link = chapter.link ? `${chapter.link.label}: ${chapter.link.href}` : ""
    return `${chapter.label}: ${chapter.title}. ${chapter.detail} ${chapter.notes.join(" ")} ${link}`.trim()
  }
  if (chapter.kind === "list") {
    return `${chapter.kicker} ${chapter.title}. ${chapter.detail}. ${chapter.lines.join(" ")}`
  }
  if (chapter.kind === "projects") {
    const lines = chapter.items.map((item, index) => `${index + 1}. ${item.title} ${item.href}`)
    return `Projects (${chapter.items.length}):\n${lines.join("\n")}`
  }
  if (chapter.kind === "certs") {
    const lines = chapter.items.map((item, index) => `${index + 1}. ${item.name} — ${item.distributor} ${item.credential}`)
    return `Certifications (${chapter.items.length}):\n${lines.join("\n")}`
  }
  if (chapter.kind === "contact") {
    const links = chapter.socials.map((item) => `${item.label} ${item.href}`).join(", ")
    const email = chapter.email ? `Email ${chapter.email}.` : "No email address is listed."
    return `Contact: ${links}. ${email}`
  }
  return ""
}

const sections = cameraStops.map((stop) => `${stop.id} (${stop.label}: ${stop.title}. ${stop.detail})`).join("\n")
const layers = [
  `Satellite ${satelliteMockId}`,
  `Sea ${seaMockId}`,
  `Traffic ${trafficMockId}`,
  `Shadow ${shadowMockId}`,
].join(", ")
const facts = profile.chapters.map(chapterFacts).filter((line) => line.length > 0)

export const systemPrompt = [
  `You guide visitors on ${profile.name}'s portfolio globe.`,
  "Answer questions about this person only from the site content below. Count lists instead of guessing. If a detail is not listed, say it is not on the site.",
  "Use goToSection for portfolio chapters.",
  "Use flyTo for any other place on Earth. Pass decimal longitude and latitude.",
  "Altitude is meters above the ground: about 800 for a street, 20000 for a city, 250000 for a region, 2500000 for a country.",
  "After flyTo the visitor can drag to look around. Use rotateView to set heading (degrees clockwise from north) and tilt (0 looks down, 60 is oblique).",
  "Use releaseView to return the globe to the chapter they scrolled to.",
  `Map sections:\n${sections}`,
  `Layers: ${layers}.`,
  ...facts,
].join("\n")
