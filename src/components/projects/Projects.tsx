import { Stack, Text } from "@mantine/core"

import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"
import { projectsData } from "./Data.ts"

export function Projects() {
  const stop = stopById("projects")
  return (
    <Chapter id={stop.id} kicker={stop.kicker} title={stop.title} detail={stop.detail}>
      <Stack gap={0} mt={4} className="pointer-events-auto max-h-[38vh] overflow-y-auto pr-2">
        {projectsData.map((project) => (
          <a
            key={project.title}
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto block py-0.5"
          >
            <Text size="sm" c="white" component="span">
              {project.title}
            </Text>
          </a>
        ))}
      </Stack>
    </Chapter>
  )
}
