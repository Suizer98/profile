import { Stack, Text, UnstyledButton } from "@mantine/core"
import { useEffect, useRef, useState } from "react"

import { cameraStops } from "../globe/stops.ts"
import { useStoryStore } from "../../store/useStoryStore.ts"

type NavItem = {
  id: string
  label: string
  children?: NavItem[]
}

const sideNav: NavItem[] = [
  { id: "home", label: "Home" },
  {
    id: "about",
    label: "About me",
    children: [
      { id: "skills", label: "Tech stacks" },
      { id: "utm", label: "University" },
      { id: "jk-land", label: "JK Land" },
      { id: "nus", label: "NUS" },
      { id: "esri", label: "Esri Singapore" },
    ],
  },
  { id: "projects", label: "Projects" },
  { id: "certs", label: "Certs" },
  { id: "contact", label: "Contact Me" },
]

function scrollToStop(id: string) {
  const section = document.querySelector<HTMLElement>(`[data-stop="${id}"]`)
  if (!section) {
    return
  }
  const top = section.offsetTop
  const before = window.scrollY
  window.scrollTo({ top, behavior: "smooth" })
  window.setTimeout(() => {
    if (Math.abs(window.scrollY - before) < 2 && Math.abs(top - before) > 2) {
      window.scrollTo({ top, behavior: "auto" })
    }
  }, 80)
}

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches)
  const hideTimer = useRef(0)
  const index = useStoryStore((state) => state.index)
  const blend = useStoryStore((state) => state.blend)
  const activeIndex = Math.min(cameraStops.length - 1, Math.max(0, Math.round(index + blend)))
  const activeId = cameraStops[activeIndex].id

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)")
    function sync() {
      setMobile(query.matches)
      if (query.matches) {
        setOpen(false)
      }
    }
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  function show() {
    window.clearTimeout(hideTimer.current)
    setOpen(true)
  }

  function hide() {
    hideTimer.current = window.setTimeout(() => setOpen(false), 220)
  }

  function go(id: string) {
    scrollToStop(id)
    if (mobile) {
      setOpen(false)
    }
  }

  return (
    <>
      {mobile && !open ? (
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/20 shadow-lg backdrop-blur-xl"
        >
          <span className="relative block h-3.5 w-5">
            <span className="absolute top-0 left-0 h-0.5 w-5 bg-white" />
            <span className="absolute top-1.5 left-0 h-0.5 w-5 bg-white" />
            <span className="absolute top-3 left-0 h-0.5 w-5 bg-white" />
          </span>
        </button>
      ) : null}
      {mobile && open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[25] bg-transparent"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <nav
        className={`fixed top-0 left-0 z-30 h-dvh ${mobile ? "pointer-events-none w-0" : "h-screen"}`}
        style={mobile ? undefined : { width: open ? 248 : 28 }}
        onMouseEnter={mobile ? undefined : show}
        onMouseLeave={mobile ? undefined : hide}
      >
        <div
          className={`absolute top-4 bottom-4 left-0 flex w-60 flex-col rounded-r-3xl border border-white/20 bg-black/45 px-5 py-6 shadow-2xl backdrop-blur-xl transition-transform duration-500 ${mobile ? "pointer-events-auto" : ""}`}
          style={{
            transform: mobile
              ? open
                ? "translateX(0)"
                : "translateX(-105%)"
              : open
                ? "translateX(0)"
                : "translateX(calc(-100% + 14px))",
            transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <Text size="xs" tt="uppercase" c="gray.4" fw={500} style={{ letterSpacing: "0.16em" }}>
            Profile
          </Text>
          <Stack gap={2} mt="lg">
            {sideNav.map((item) => (
              <div key={item.id}>
                <UnstyledButton onClick={() => go(item.id)} className="block w-full rounded-lg px-2 py-1.5 text-left">
                  <Text size="sm" fw={activeId === item.id ? 600 : 400} c={activeId === item.id ? "white" : "gray.4"}>
                    {item.label}
                  </Text>
                </UnstyledButton>
                {item.children ? (
                  <Stack gap={0} pl="md">
                    {item.children.map((child) => (
                      <UnstyledButton
                        key={child.id}
                        onClick={() => go(child.id)}
                        className="block w-full rounded-lg px-2 py-1 text-left"
                      >
                        <Text
                          size="xs"
                          fw={activeId === child.id ? 600 : 400}
                          c={activeId === child.id ? "white" : "gray.5"}
                        >
                          {child.label}
                        </Text>
                      </UnstyledButton>
                    ))}
                  </Stack>
                ) : null}
              </div>
            ))}
          </Stack>
        </div>
      </nav>
    </>
  )
}
