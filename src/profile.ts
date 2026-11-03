// Fill this file in. The page, side menu, globe, and guide all read it.
// Chapter order is the scroll order. Chapters that share a group nest under the first one.
// kicker is the small line, title is the large line, detail is the subtitle.
// camera.altitude is meters. tilt 0 looks down. heading is degrees clockwise from north.
// orbit lets visitors drag to look around. depart is how the camera leaves: descent, ground, or dive.
// scene plays a built-in globe effect on that chapter: sea, traffic, shadow, or weather.
// weather, used with scene "weather", is rain, snow, fog, or cloudy.
// aliases are extra names the guide accepts. Skill icons: https://skillicons.dev

export type Camera = {
  longitude: number
  latitude: number
  altitude: number
  tilt: number
  heading: number
}

export type Depart = "descent" | "ground" | "dive"

export type Scene = "sea" | "traffic" | "shadow" | "weather"

export type Weather = "rain" | "snow" | "fog" | "cloudy"

type ChapterBase = {
  id: string
  label: string
  kicker: string
  title: string
  detail: string
  camera: Camera
  group?: string
  orbit?: boolean
  depart?: Depart
  scene?: Scene
  weather?: Weather
  aliases?: string[]
}

export type TextChapter = ChapterBase & { kind: "text" }

export type AboutChapter = ChapterBase & {
  kind: "about"
  paragraphs: string[]
}

export type SkillsChapter = ChapterBase & {
  kind: "skills"
  groups: { title: string; icons: string[] }[]
}

export type NotesChapter = ChapterBase & {
  kind: "notes"
  notes: string[]
  link?: { label: string; href: string }
}

export type ListChapter = ChapterBase & {
  kind: "list"
  lines: string[]
}

export type ProjectsChapter = ChapterBase & {
  kind: "projects"
  items: { title: string; href: string }[]
}

export type CertsChapter = ChapterBase & {
  kind: "certs"
  items: { name: string; distributor: string; credential: string }[]
}

export type ContactChapter = ChapterBase & {
  kind: "contact"
  email?: string
  socials: { label: string; href: string; icon: string }[]
}

export type Chapter =
  | TextChapter
  | AboutChapter
  | SkillsChapter
  | NotesChapter
  | ListChapter
  | ProjectsChapter
  | CertsChapter
  | ContactChapter

export type Profile = {
  name: string
  siteTitle: string
  navTitle: string
  chapters: Chapter[]
}

export type NavItem = {
  id: string
  label: string
  children?: NavItem[]
}

type NavDraft = NavItem & { group?: string }

export function sideNav(chapters: Chapter[]): NavItem[] {
  const items: NavDraft[] = []
  for (const chapter of chapters) {
    if (!chapter.group) {
      items.push({ id: chapter.id, label: chapter.label })
      continue
    }
    const last = items[items.length - 1]
    if (last?.group === chapter.group) {
      last.children = [...(last.children ?? []), { id: chapter.id, label: chapter.label }]
      continue
    }
    items.push({ id: chapter.id, label: chapter.label, group: chapter.group, children: [] })
  }
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    children: item.children && item.children.length > 0 ? item.children : undefined,
  }))
}

export const profile: Profile = {
  name: "Tey Sui Zer",
  siteTitle: "Sui Zer - Profile",
  navTitle: "Profile",
  chapters: [
    {
      kind: "text",
      id: "home",
      label: "Home",
      kicker: "From orbit",
      title: "Tey Sui Zer",
      detail: "Scroll to come down to Earth and meet me",
      depart: "descent",
      camera: { longitude: 103.8, latitude: -6, altitude: 6500000, tilt: 22, heading: 0 },
    },
    {
      kind: "about",
      id: "about",
      group: "about",
      label: "About me",
      kicker: "About me",
      title: "Closer in",
      detail: "",
      depart: "ground",
      scene: "sea",
      camera: { longitude: 103.82, latitude: -0.4879, altitude: 300000, tilt: 34, heading: 0 },
      paragraphs: [
        "A software engineer specialising in full-stack web development, with a strong foundation in GIS and geomatics engineering. My passionate curiosity drives me to develop innovative, scalable, and user-centric software solutions that integrate modern web technologies to address complex real-world challenges.",
        "Through my experience at Esri, a global leader in GIS technology, I have developed expertise in building and implementing software solutions that address complex geospatial challenges. My cross-disciplinary background in geomatics engineering and full-stack software development lets me bridge the gap between spatial data and software, transforming geospatial data into actionable insights.",
      ],
    },
    {
      kind: "skills",
      id: "skills",
      group: "about",
      label: "Tech stacks",
      kicker: "About me",
      title: "Tech stacks",
      detail: "Languages, web, cloud, and GIS.",
      depart: "dive",
      scene: "sea",
      camera: { longitude: 103.82, latitude: 0.85, altitude: 36000, tilt: 50, heading: 0 },
      groups: [
        {
          title: "Programming languages",
          icons: ["ts", "js", "python", "cs", "css", "html", "matlab", "go", "octave", "r", "kotlin", "cpp", "c"],
        },
        {
          title: "Frontend",
          icons: ["react", "svelte", "nextjs", "redux", "tailwind", "vite", "bun", "npm", "yarn", "qt", "svg"],
        },
        {
          title: "Backend",
          icons: ["django", "fastapi", "flask", "redis", "prisma", "selenium", "dotnet"],
        },
        {
          title: "Testing",
          icons: ["vitest", "jest"],
        },
        {
          title: "DevOps and cloud",
          icons: ["docker", "aws", "azure", "gitlab", "githubactions", "ansible", "nginx", "gcp", "kubernetes"],
        },
        {
          title: "Databases",
          icons: ["postgres", "mysql", "mongodb", "sqlite"],
        },
        {
          title: "Systems",
          icons: ["redhat", "windows", "ubuntu", "apple", "linux", "bash", "powershell"],
        },
        {
          title: "Editors",
          icons: ["vscode", "sublime", "pycharm", "vim", "visualstudio"],
        },
        {
          title: "Tools",
          icons: ["git", "github", "netlify", "vercel", "heroku", "anaconda", "grafana", "cmake", "postman", "md", "notion"],
        },
        {
          title: "Geomatics and GIS",
          icons: ["autocad", "sketchup"],
        },
      ],
    },
    {
      kind: "notes",
      id: "utm",
      group: "about",
      label: "Education",
      kicker: "Education",
      title: "Universiti Teknologi Malaysia",
      detail: "Studied Geomatics Engineering at the Faculty of Built Environment and Surveying, Johor Bahru. 2018 — 2022",
      orbit: true,
      aliases: ["University"],
      camera: { longitude: 103.637657, latitude: 1.553217, altitude: 560, tilt: 50, heading: 0 },
      notes: ["Grade: Dean's List & First Class"],
    },
    {
      kind: "notes",
      id: "geostars",
      group: "about",
      label: "Competition",
      kicker: "Education",
      title: "Competition achievement",
      detail: "Grab GeoStars 2022 · 4th place",
      orbit: true,
      camera: { longitude: 103.637657, latitude: 1.553217, altitude: 560, tilt: 50, heading: 0 },
      notes: [
        "A web GIS project on EV charging stations and economic areas, held at UTM for the Grab GeoStars Program 2022. Grab is a Southeast Asian app for transport and food delivery.",
      ],
      link: {
        label: "Download the journal",
        href: "https://github.com/Suizer98/suizer/raw/main/Journal%20Tey.pdf",
      },
    },
    {
      kind: "text",
      id: "horizon",
      group: "experience",
      label: "Professional Experiences",
      kicker: "Professional Experiences",
      title: "Bringing you to my work horizons",
      detail: "",
      camera: { longitude: 103.7, latitude: 1.45, altitude: 8000, tilt: 48, heading: 0 },
    },
    {
      kind: "list",
      id: "jk-land",
      group: "experience",
      label: "JK Land",
      kicker: "2021",
      title: "JK Land Consulting",
      detail: "Geomatics Engineer · Johor Bahru",
      orbit: true,
      scene: "traffic",
      camera: { longitude: 103.6510454, latitude: 1.52091, altitude: 560, tilt: 50, heading: 0 },
      lines: [
        "Engaged in field works such as topographic, demarcation, land title, traverse engineering, GPS RTK network, multi-beam hydrographic and underground utility surveys.",
        "Carried out post-processing, digitizing and analysis of UAV, hydrography, stockpiles, 3D TLS point cloud data. Produced UUDM & engineering plans using AutoCAD and CDS.",
      ],
    },
    {
      kind: "list",
      id: "nus",
      group: "experience",
      label: "NUS",
      kicker: "2022 — 2025",
      title: "National University of Singapore",
      detail: "Software Engineer · Kent Ridge",
      orbit: true,
      scene: "shadow",
      camera: { longitude: 103.7742101, latitude: 1.291574, altitude: 560, tilt: 50, heading: 0 },
      lines: [
        "React TS, BlueprintJS, Zustand, OpenLayers",
        "Django Rest, OpenAPI, Geoserver, PostgreSQL, PostGIS",
        "Docker, GitLab CI/CD, Ansible",
        "Microsoft Azure in Singapore GCC Cloud",
        "Playwright, Vitest, Django test framework, Pytest",
        "Windows, WSL2 Ubuntu and RHEL Administrations",
        "QGIS Plugin Developments with PyQt5",
        "TMSI researches (GIS, Geomatics, Climate Change, Marine Science)",
      ],
    },
    {
      kind: "list",
      id: "esri",
      group: "experience",
      label: "Esri Singapore",
      kicker: "2025 — Present",
      title: "Esri Singapore",
      detail: "Software Engineer · 351 Braddell Road",
      orbit: true,
      scene: "weather",
      weather: "rain",
      camera: { longitude: 103.8450433, latitude: 1.337284, altitude: 560, tilt: 50, heading: 0 },
      lines: ["ESRI certified software engineer", "MVP of Esri Singapore 2026"],
    },
    {
      kind: "projects",
      id: "projects",
      label: "Projects",
      kicker: "Projects",
      title: "Personal projects",
      detail: "Self learn applications, side hustles, tools and more",
      camera: { longitude: 103.82, latitude: 1.12, altitude: 18000, tilt: 52, heading: 0 },
      items: [
        { title: "SgStats", href: "https://github.com/Suizer98/SgStats" },
        { title: "Potato Merch AI", href: "https://github.com/Suizer98/potato-merch-ai" },
        { title: "Pydxf", href: "https://github.com/Suizer98/pydxf" },
        { title: "ArcGIS JS + AI", href: "https://github.com/Suizer98/arcgisjsai" },
        { title: "Love ESRI", href: "https://github.com/Suizer98/love-esri" },
        { title: "DeckGLGIS", href: "https://github.com/Suizer98/DeckGLGIS" },
        { title: "NextjsAzure", href: "https://github.com/Suizer98/nextjsazure" },
        { title: "Simple Web Map demo", href: "https://github.com/Suizer98/mapdemo" },
        { title: "DjangoGIS", href: "https://github.com/Suizer98/djangogis" },
        { title: "RINEX Satellite Orbit Computation", href: "https://github.com/Suizer98/rinexpos" },
        { title: "Docker ArcGIS Enterprise AI", href: "https://github.com/Suizer98/docker-arcgis-enterprise-ai" },
      ],
    },
    {
      kind: "certs",
      id: "certs",
      label: "Certs",
      kicker: "Certifications",
      title: "Credentials",
      detail: "AWS, Azure, Esri, and Oracle.",
      camera: { longitude: 103.82, latitude: 0.85, altitude: 36000, tilt: 50, heading: 0 },
      items: [
        {
          name: "AWS Certified Solutions Architect – Associate",
          distributor: "Amazon Web Services (AWS)",
          credential: "https://www.credly.com/badges/a2bbc9c1-7d4a-44f2-a994-87c6680d6de3/linked_in_profile",
        },
        {
          name: "Microsoft Certified: Azure AI Cloud Developer Associate",
          distributor: "Microsoft",
          credential:
            "https://learn.microsoft.com/api/credentials/share/en-us/suizer/B343CFF3134D3D56?sharingId=981D329E1C3AFFDB",
        },
        {
          name: "ArcGIS API for Python Associate 2026",
          distributor: "Esri",
          credential: "https://www.credly.com/badges/760b5652-ee78-4c87-bd1a-286a55a6b9dc/linked_in_profile",
        },
        {
          name: "ArcGIS Maps SDK for JavaScript Associate 2024",
          distributor: "Esri",
          credential: "https://www.credly.com/badges/c448b4c6-b424-4531-a60d-6ac01b209f5c/linked_in_profile",
        },
        {
          name: "MySQL 8.0 Database Developer Oracle Certified Professional",
          distributor: "Oracle",
          credential:
            "https://catalog-education.oracle.com/pls/certview/sharebadge?id=FCE4E5C333F1AB52E9942A184357091CCDA3C9261FD253C5CF7703B558E42360",
        },
        {
          name: "Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate",
          distributor: "Oracle",
          credential:
            "https://catalog-education.oracle.com/pls/certview/sharebadge?id=77C4F7C373BDF4E30D75DEDE9EC46DF40A9D3F5332BAF6B0B866EF7FC18845EB",
        },
        {
          name: "Oracle Cloud Infrastructure 2025 Certified Foundations Associate",
          distributor: "Oracle",
          credential:
            "https://catalog-education.oracle.com/pls/certview/sharebadge?id=7D5920F6D1F1C3454E5160B40CA397E9B62AE7BD8ECF028FE8CE7F3210C09A92",
        },
        {
          name: "MySQL Implementation Certified Associate",
          distributor: "Oracle",
          credential:
            "https://catalog-education.oracle.com/ords/certview/sharebadge?id=0092DB31C0CBBB8B0E03E7C53F75D6005D8D6D467CF0B0516D5D89AA033CDFCD",
        },
        {
          name: "ArcGIS Pro: Essential Workflows",
          distributor: "ESRI",
          credential: "https://drive.google.com/file/d/1QZ40Vz2Ix_mtvXVhQgf1EveyStYBcLbG/view",
        },
        {
          name: "Getting Started with ArcGIS Pro",
          distributor: "ESRI",
          credential: "https://drive.google.com/file/d/1sOH6GH0VmfEaaSiYRFlmDtDqfQauWjuq/view",
        },
        {
          name: "Data or Specimens Only Research - Basic/Refresher",
          distributor: "CITI Program",
          credential: "https://www.citiprogram.org/verify/?w592b01ff-4d89-4a73-8196-2f48abd76736-64750677",
        },
        {
          name: "Responsible Conduct of Research for Engineers",
          distributor: "CITI Program",
          credential: "https://www.citiprogram.org/verify/?w81811635-c1ee-4887-877e-ecaad29b120b-64750678",
        },
        {
          name: "Data Literacy Programme",
          distributor: "National University of Singapore",
          credential: "https://drive.google.com/file/d/13bI6aRxht8Vnrj8Ery0pO2sQJH8Wmzf6/view?usp=sharing",
        },
        {
          name: "Microsoft Certified: Azure AI Fundamentals",
          distributor: "Microsoft",
          credential:
            "https://learn.microsoft.com/api/credentials/share/en-us/suizer/4FA11589692F0090?sharingId=981D329E1C3AFFDB",
        },
        {
          name: "Artificial Intelligence Competency Course",
          distributor: "National University of Singapore",
          credential: "https://drive.google.com/file/d/19ut2cJ3E0mNbtMymwLjkbWApUuIGiwHs/view?usp=sharing",
        },
        {
          name: "Data Analytics A-Z with Python",
          distributor: "Udemy",
          credential: "https://www.udemy.com/certificate/UC-446d1d6a-8ede-4520-880f-d0b7ec192078/",
        },
        {
          name: "Analyze Data to Answer Questions",
          distributor: "Google",
          credential: "https://coursera.org/share/67aa94ea460fdaca25fdb8144c82f6ca",
        },
        {
          name: "Introduction to Cybersecurity",
          distributor: "Cisco",
          credential: "https://www.credly.com/badges/75a6faa2-f844-4c19-97df-6b6d49e7c92c?source=linked_in_profile",
        },
        {
          name: "Build a Machine Learning Web App with Streamlit and Python",
          distributor: "Coursera",
          credential:
            "https://www.coursera.org/account/accomplishments/verify/SV4HVGGVJBRN?utm_source=link&utm_medium=certificate&utm_content=cert_image&utm_campaign=sharing_cta&utm_product=project",
        },
        {
          name: "Graduate Admission Prediction with Pyspark ML",
          distributor: "Coursera",
          credential: "https://coursera.org/share/2048cb67063796418b3557cad1400d57",
        },
        {
          name: "Deploying a Python Data Analysis web app on Heroku",
          distributor: "Coursera",
          credential: "https://coursera.org/share/2862f69186afbd272d14c5db14db7b0b",
        },
        {
          name: "Survey of python in GIS applications",
          distributor: "Udemy",
          credential: "https://www.udemy.com/certificate/UC-4ade2c59-4228-4f1f-bde2-5b3584acaffe/",
        },
      ],
    },
    {
      kind: "contact",
      id: "contact",
      label: "Contact Me",
      kicker: "Contact Me",
      title: "At Singapore",
      detail: "For more information.",
      camera: { longitude: 103.82, latitude: 0.65, altitude: 60000, tilt: 48, heading: 0 },
      socials: [
        { label: "LinkedIn", href: "https://www.linkedin.com/in/teysuizer1998/", icon: "fa-brands fa-linkedin" },
        { label: "GitHub", href: "https://github.com/Suizer98", icon: "fa-brands fa-square-github" },
      ],
    },
  ],
}
