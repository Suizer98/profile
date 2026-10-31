import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"

export function Home() {
  const stop = stopById("home")
  return <Chapter id={stop.id} kicker={stop.kicker} title={stop.title} detail={stop.detail} />
}
