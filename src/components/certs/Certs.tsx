import { Text } from "@mantine/core"

import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"
import { certificationsData } from "./Data.ts"

export function Certs() {
  const stop = stopById("certs")
  return (
    <Chapter id={stop.id} kicker={stop.kicker} title={stop.title} detail={stop.detail}>
      <ul className="pointer-events-auto mt-1 grid max-h-[calc(100dvh-9.5rem)] grid-cols-2 gap-x-3 gap-y-0.5 overflow-y-auto pr-1 md:mt-2 md:max-h-[38vh] md:gap-x-6 md:pr-2">
        {certificationsData.map((certification) => (
          <li key={certification.name}>
            <a
              href={certification.credential}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto block py-0.5 text-[11px]! leading-tight! no-underline md:py-0.5 md:text-xs! md:leading-normal!"
            >
              <Text c="white" fw={500} component="span" className="text-[11px]! leading-tight! md:text-xs! md:leading-normal!">
                {certification.name}
              </Text>
              <Text c="gray.2" component="span" className="text-[11px]! leading-tight! md:text-xs! md:leading-normal!">
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
