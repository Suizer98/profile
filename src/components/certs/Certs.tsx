import { Text } from "@mantine/core"

import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"
import { certificationsData } from "./Data.ts"

export function Certs() {
  const stop = stopById("certs")
  return (
    <Chapter id={stop.id} kicker={stop.kicker} title={stop.title} detail={stop.detail}>
      <ul className="pointer-events-auto mt-1 grid max-h-[26vh] grid-cols-1 gap-x-6 gap-y-0.5 overflow-y-auto pr-2 md:mt-2 md:max-h-[38vh] md:grid-cols-2">
        {certificationsData.map((certification) => (
          <li key={certification.name}>
            <a
              href={certification.credential}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto block py-0.5 no-underline"
            >
              <Text size="xs" c="white" fw={500} component="span">
                {certification.name}
              </Text>
              <Text size="xs" c="gray.2" component="span">
                {" · "}
                {certification.distributor}
              </Text>
            </a>
          </li>
        ))}
      </ul>
    </Chapter>
  )
}
