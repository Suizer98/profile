import { Chapter } from "../chapter/Chapter.tsx"
import { stopById } from "../globe/stops.ts"

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/teysuizer1998/", icon: "fa-brands fa-linkedin" },
  { label: "GitHub", href: "https://github.com/Suizer98", icon: "fa-brands fa-square-github" },
]

export function Contact() {
  const stop = stopById("contact")
  return (
    <Chapter id={stop.id} kicker={stop.kicker} title={stop.title} detail={stop.detail}>
      <ul className="pointer-events-auto mt-3 flex list-none gap-5">
        {socials.map((social) => (
          <li key={social.label}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="pointer-events-auto block text-3xl text-gray-300 transition-colors hover:text-white"
            >
              <i className={social.icon} />
            </a>
          </li>
        ))}
      </ul>
    </Chapter>
  )
}
