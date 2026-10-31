import { Text } from "@mantine/core"

import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"
import { skillGroups } from "./Data.ts"

export function Skills() {
  const stop = stopById("skills")
  return (
    <Chapter id={stop.id} kicker={stop.kicker} title={stop.title} detail={stop.detail}>
      <ul className="pointer-events-auto mt-2 max-h-[34vh] list-none space-y-3 overflow-y-auto pr-2">
        {skillGroups.map((group) => (
          <li key={group.title}>
            <Text size="xs" c="white" fw={600} tt="uppercase" style={{ letterSpacing: "0.08em" }}>
              {group.title}
            </Text>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {group.icons.map((icon) => (
                <img
                  key={icon}
                  src={`https://skillicons.dev/icons?i=${icon}`}
                  alt={icon}
                  className="h-8"
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Chapter>
  )
}
