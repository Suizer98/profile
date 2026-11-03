import { Stack, Text, Title } from "@mantine/core"
import type { ReactNode } from "react"

import { cameraStops } from "../globe/stops.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"

type ChapterProps = {
  id: string
  kicker: string
  title: string
  detail: string
  children?: ReactNode
}

function chapterOpacity(index: number, blend: number, stopIndex: number) {
  const position = index + blend - stopIndex
  const fadeIn = Math.min(1, Math.max(0, (position + 0.36) / 0.18))
  const fadeOut = Math.min(1, Math.max(0, (1.08 - position) / 0.18))
  return Math.min(fadeIn, fadeOut)
}

export function Chapter({ id, kicker, title, detail, children }: ChapterProps) {
  const index = useStoryStore((state) => state.index)
  const blend = useStoryStore((state) => state.blend)
  const stopIndex = cameraStops.findIndex((stop) => stop.id === id)
  const opacity = chapterOpacity(index, blend, stopIndex)

  return (
    <section data-stop={id} className="pointer-events-none h-[140svh] md:h-[200vh]">
        <div className="sticky top-0 flex h-svh items-end px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:h-screen md:px-5 md:pr-[8vw] md:pb-[12vh] md:pl-[20rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 md:hidden"
          style={{
            top: "18%",
            background:
              "linear-gradient(to top, #000 0%, rgba(0,0,0,0.94) 8%, rgba(0,0,0,0.82) 34%, rgba(0,0,0,0.4) 70%, transparent 100%)",
          }}
        />
        <Stack gap={4} className="chapter-copy relative min-w-0 max-w-[760px] md:gap-1.5" style={{ opacity }}>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10 hidden md:block"
            style={{
              background:
                "radial-gradient(ellipse at 18% 70%, rgba(0,0,0,0.72), rgba(0,0,0,0.34) 52%, transparent 76%)",
            }}
          />
          <Text size="xs" tt="uppercase" fw={600} c="white" className="md:text-sm" style={{ letterSpacing: "0.08em" }}>
            {kicker}
          </Text>
          <Title
            order={2}
            fw={650}
            lh={0.95}
            c="white"
            fz="clamp(1.65rem, 7.2vw, 5.5rem)"
            style={{ letterSpacing: "-0.045em" }}
          >
            {title}
          </Title>
          {detail ? (
            <Text fw={500} c="white" className="max-w-xl text-[0.95rem] leading-snug md:text-lg md:leading-normal">
              {detail}
            </Text>
          ) : null}
          {children}
        </Stack>
      </div>
    </section>
  )
}
