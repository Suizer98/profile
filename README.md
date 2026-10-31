# Tey Sui Zer

A scroll-driven portfolio. The globe comes down from orbit through education, work, projects, and contact.

![Tech stacks](https://skillicons.dev/icons?i=vite,ts,react,tailwind,css,html,docker,npm)

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
