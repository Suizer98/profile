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
}

export const cameraStops: CameraStop[] = [
  {
    id: "home",
    label: "Home",
    kicker: "From orbit",
    title: "Tey Sui Zer",
    detail: "Scroll to come down to Earth and meet me",
    longitude: 103.8,
    latitude: -6,
    altitude: 6500000,
    tilt: 22,
    heading: 0,
  },
  {
    id: "about",
    label: "About me",
    kicker: "About me",
    title: "Closer in",
    detail:
      "A software engineer specialising in full-stack web development, with a strong foundation in GIS and geomatics engineering. My passionate curiosity drives me to develop innovative, scalable, and user-centric software solutions that integrate modern web technologies to address complex real-world challenges.",
    longitude: 103.15,
    latitude: -0.39,
    altitude: 300000,
    tilt: 34,
    heading: 0,
  },
  {
    id: "skills",
    label: "Tech stacks",
    kicker: "About me",
    title: "Tech stacks",
    detail: "Languages, web, cloud, and GIS.",
    longitude: 103.82,
    latitude: 1.17,
    altitude: 38000,
    tilt: 26,
    heading: 0,
  },
  {
    id: "utm",
    label: "University",
    kicker: "Education",
    title: "Universiti Teknologi Malaysia",
    detail: "Studied Geomatics Engineering at the Faculty of Built Environment and Surveying, Johor Bahru. 2018 — 2022",
    longitude: 103.635561,
    latitude: 1.552529,
    altitude: 560,
    tilt: 50,
    heading: 0,
  },
  {
    id: "horizon",
    label: "Work",
    kicker: "Work",
    title: "Bringing you to my work horizons",
    detail: "",
    longitude: 103.7,
    latitude: 1.45,
    altitude: 8000,
    tilt: 48,
    heading: 0,
  },
  {
    id: "jk-land",
    label: "JK Land",
    kicker: "2021",
    title: "JK Land Consulting",
    detail: "Geomatics Engineer · Johor Bahru",
    longitude: 103.6510454,
    latitude: 1.52091,
    altitude: 560,
    tilt: 50,
    heading: 0,
  },
  {
    id: "nus",
    label: "NUS",
    kicker: "2022 — 2025",
    title: "National University of Singapore",
    detail: "Software Engineer · Kent Ridge",
    longitude: 103.7742101,
    latitude: 1.291574,
    altitude: 560,
    tilt: 50,
    heading: 0,
  },
  {
    id: "esri",
    label: "Esri Singapore",
    kicker: "2025 — Present",
    title: "Esri Singapore",
    detail: "Software Engineer · 351 Braddell Road",
    longitude: 103.8450433,
    latitude: 1.337284,
    altitude: 560,
    tilt: 50,
    heading: 0,
  },
  {
    id: "projects",
    label: "Projects",
    kicker: "Projects",
    title: "Personal projects",
    detail: "Maps, web apps, and the tools around them.",
    longitude: 103.82,
    latitude: 1.12,
    altitude: 18000,
    tilt: 52,
    heading: 0,
  },
  {
    id: "certs",
    label: "Certs",
    kicker: "Certifications",
    title: "Credentials",
    detail: "AWS, Azure, Esri, and Oracle.",
    longitude: 103.82,
    latitude: 0.85,
    altitude: 36000,
    tilt: 50,
    heading: 0,
  },
  {
    id: "contact",
    label: "Contact Me",
    kicker: "Contact Me",
    title: "At Singapore",
    detail: "For more information.",
    longitude: 103.82,
    latitude: 0.65,
    altitude: 60000,
    tilt: 48,
    heading: 0,
  },
]

export function stopById(id: string) {
  const stop = cameraStops.find((item) => item.id === id)
  if (!stop) {
    throw new Error(`Missing camera stop ${id}`)
  }
  return stop
}
