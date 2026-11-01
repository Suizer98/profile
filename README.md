# Tey Sui Zer

A scroll-driven portfolio. The globe comes down from orbit through education, work, projects, and contact.

![Tech stacks](https://skillicons.dev/icons?i=vite,ts,react,tailwind,css,html,docker,npm)

## Your details

Edit src/profile.ts. The name, chapters, places, skills, jobs, projects, certifications, and contact all live there. The page, side menu, globe, and guide read that file.

Chapter order is the scroll order. Chapters that share a group sit under the first chapter of that group in the side menu.

camera.altitude is meters above the ground. tilt 0 looks down. heading is degrees clockwise from north. Set orbit on a street-level chapter so visitors can drag to look around.

Skill icons use ids from https://skillicons.dev.

## Start

```
docker compose up --build
```

Open http://localhost:3000

Stop the services:

```
docker compose down
```

## Local dev

```
npm install
npm run dev
```

## Lint

Lint the project:

```
npm run lint
```

Lint staged files. A commit runs this through the git hook:

```
npm run lint-staged
```

Inside the running container:

```
docker compose exec profile npm run lint
docker compose exec profile npm run lint-staged
```

## Build

```
npm run build
```
