import { Text } from "@mantine/core"

import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"
import { Experiences } from "./Experiences.tsx"
import { Skills } from "./Skills.tsx"

export function About() {
  const about = stopById("about")
  const education = stopById("utm")
  const horizon = stopById("horizon")
  return (
    <>
      <Chapter id={about.id} kicker={about.kicker} title={about.title} detail="">
        <div className="pointer-events-auto max-h-[34vh] max-w-xl overflow-y-auto pr-2">
          <Text size="md" fw={500} c="white" className="text-justify">
            {about.detail}
          </Text>
          <Text size="md" fw={500} c="white" className="text-justify" mt="md">
            Through my experience at Esri, a global leader in GIS technology, I have developed expertise
            in building and implementing software solutions that address complex geospatial challenges.
            My cross-disciplinary background in geomatics engineering and full-stack software
            development lets me bridge the gap between spatial data and software, transforming
            geospatial data into actionable insights.
          </Text>
        </div>
      </Chapter>
      <Skills />
      <Chapter
        id={education.id}
        kicker={education.kicker}
        title={education.title}
        detail={education.detail}
      />
      <Chapter id={horizon.id} kicker={horizon.kicker} title={horizon.title} detail={horizon.detail} />
      <Experiences />
    </>
  )
}
