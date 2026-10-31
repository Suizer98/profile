import { Stack, Text } from "@mantine/core"

import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"

const journalHref = "https://github.com/Suizer98/suizer/raw/main/Journal%20Tey.pdf"

const copyClass = "text-left text-[0.95rem] leading-snug md:text-base md:leading-normal"

export function Education() {
  const university = stopById("utm")
  const competition = stopById("geostars")
  return (
    <>
      <Chapter id={university.id} kicker={university.kicker} title={university.title} detail={university.detail}>
        <Text fw={600} c="white" className={copyClass}>
          Grade: Dean's List & First Class
        </Text>
      </Chapter>
      <Chapter id={competition.id} kicker={competition.kicker} title={competition.title} detail={competition.detail}>
        <Stack gap={6} className="pointer-events-auto max-w-xl">
          <Text fw={500} c="white" className={copyClass}>
            A web GIS project on EV charging stations and economic areas, held at UTM for the Grab GeoStars Program
            2022. Grab is a Southeast Asian app for transport and food delivery.
          </Text>
          <Text fw={500} c="white" className={copyClass}>
            <a href={journalHref} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
              Download the journal
            </a>
          </Text>
        </Stack>
      </Chapter>
    </>
  )
}
