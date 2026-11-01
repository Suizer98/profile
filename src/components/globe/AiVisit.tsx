import { Stack, Text, Title } from "@mantine/core"

import { useGlobeStore } from "../../store/useGlobeStore.ts"

export function AiVisit() {
  const visit = useGlobeStore((state) => state.visit)
  if (!visit) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[26] flex items-end px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-5 md:pr-[8vw] md:pb-[12vh] md:pl-[17rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 md:hidden"
        style={{
          top: "-40vh",
          background:
            "linear-gradient(to top, #000 0%, rgba(0,0,0,0.94) 8%, rgba(0,0,0,0.82) 34%, rgba(0,0,0,0.4) 70%, transparent 100%)",
        }}
      />
      <Stack gap={4} className="chapter-copy relative min-w-0 max-w-[760px] md:gap-1.5">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10 hidden md:block"
          style={{
            background:
              "radial-gradient(ellipse at 18% 70%, rgba(0,0,0,0.72), rgba(0,0,0,0.34) 52%, transparent 76%)",
          }}
        />
        <Text size="xs" tt="uppercase" fw={600} c="white" className="md:text-sm" style={{ letterSpacing: "0.08em" }}>
          AI Actions
        </Text>
        <Title order={2} fw={650} lh={0.95} c="white" fz="clamp(1.65rem, 7.2vw, 5.5rem)" style={{ letterSpacing: "-0.045em" }}>
          {visit.title}
        </Title>
        {visit.summary ? (
          <Text fw={500} c="white" className="max-w-xl text-[0.95rem] leading-snug md:text-lg md:leading-normal">
            {visit.summary}
          </Text>
        ) : null}
      </Stack>
    </div>
  )
}
