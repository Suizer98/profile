import { Stack, Text } from "@mantine/core"

import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"
import { experiencesData } from "./Data.ts"

export function Experiences() {
  return (
    <>
      {experiencesData.map((experience) => {
        const stop = stopById(experience.id)
        return (
          <Chapter
            key={experience.id}
            id={stop.id}
            kicker={stop.kicker}
            title={stop.title}
            detail={stop.detail}
          >
            <Stack gap={2} mt={4}>
              {experience.lines.map((line) => (
                <Text key={line} c="white" fw={500} className="max-w-xl text-[0.95rem] leading-snug md:text-sm md:leading-normal">
                  {line}
                </Text>
              ))}
            </Stack>
          </Chapter>
        )
      })}
    </>
  )
}
