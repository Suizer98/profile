import { Stack, Text } from "@mantine/core"

import {
  profile,
  type AboutChapter,
  type CertsChapter,
  type Chapter,
  type ContactChapter,
  type ListChapter,
  type NotesChapter,
  type ProjectsChapter,
  type SkillsChapter,
} from "../../profile.ts"
import { Chapter as ChapterView } from "../chapter/Chapter.tsx"

const copyClass = "text-left text-[0.95rem] leading-snug md:text-base md:leading-normal"

function AboutBody({ chapter }: { chapter: AboutChapter }) {
  return (
    <div className="pointer-events-auto max-h-[calc(var(--app-height,100dvh)*0.26)] max-w-xl overflow-y-auto pr-2 md:max-h-[34vh]">
      {chapter.paragraphs.map((paragraph, index) => (
        <Text
          key={paragraph}
          fw={500}
          c="white"
          mt={index === 0 ? undefined : "sm"}
          className="text-left text-[0.95rem] leading-snug md:text-justify md:text-base md:leading-normal"
        >
          {paragraph}
        </Text>
      ))}
    </div>
  )
}

function SkillsBody({ chapter }: { chapter: SkillsChapter }) {
  return (
    <ul className="pointer-events-auto mt-1 max-h-[calc(var(--app-height,100dvh)*0.26)] list-none space-y-2 overflow-y-auto pr-2 md:mt-2 md:max-h-[34vh] md:space-y-3">
      {chapter.groups.map((group) => (
        <li key={group.title}>
          <Text size="sm" c="white" fw={700} tt="uppercase" style={{ letterSpacing: "0.06em" }}>
            {group.title}
          </Text>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {group.icons.map((icon) => (
              <img key={icon} src={`https://skillicons.dev/icons?i=${icon}`} alt={icon} className="h-8" />
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}

function NotesBody({ chapter }: { chapter: NotesChapter }) {
  if (!chapter.link) {
    return (
      <>
        {chapter.notes.map((note) => (
          <Text key={note} fw={600} c="white" className={copyClass}>
            {note}
          </Text>
        ))}
      </>
    )
  }
  return (
    <Stack gap={6} className="pointer-events-auto max-w-xl">
      {chapter.notes.map((note) => (
        <Text key={note} fw={500} c="white" className={copyClass}>
          {note}
        </Text>
      ))}
      <Text fw={500} c="white" className={copyClass}>
        <a href={chapter.link.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
          {chapter.link.label}
        </a>
      </Text>
    </Stack>
  )
}

function ListBody({ chapter }: { chapter: ListChapter }) {
  return (
    <Stack gap={2} mt={4}>
      {chapter.lines.map((line) => (
        <Text key={line} c="white" fw={500} className="max-w-xl text-[0.95rem] leading-snug md:text-sm md:leading-normal">
          {line}
        </Text>
      ))}
    </Stack>
  )
}

function ProjectsBody({ chapter }: { chapter: ProjectsChapter }) {
  return (
    <Stack gap={0} mt={2} className="pointer-events-auto max-h-[calc(var(--app-height,100dvh)*0.26)] overflow-y-auto pr-2 md:mt-1 md:max-h-[38vh]">
      {chapter.items.map((project) => (
        <a
          key={project.title}
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto block py-0.5"
        >
          <Text size="sm" c="white" component="span">
            {project.title}
          </Text>
        </a>
      ))}
    </Stack>
  )
}

function CertsBody({ chapter }: { chapter: CertsChapter }) {
  return (
    <ul className="pointer-events-auto mt-1 grid max-h-[calc(var(--app-height,100dvh)-9.5rem)] grid-cols-2 gap-x-3 gap-y-0.5 overflow-y-auto pr-1 md:mt-2 md:max-h-[38vh] md:gap-x-6 md:pr-2">
      {chapter.items.map((certification) => (
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
  )
}

function ContactBody({ chapter }: { chapter: ContactChapter }) {
  return (
    <>
      {chapter.email ? (
        <Text fw={500} c="white" className={copyClass}>
          <a href={`mailto:${chapter.email}`} className="pointer-events-auto underline">
            {chapter.email}
          </a>
        </Text>
      ) : null}
      <ul className="pointer-events-auto mt-3 flex list-none gap-5">
        {chapter.socials.map((social) => (
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
    </>
  )
}

function ChapterBody({ chapter }: { chapter: Chapter }) {
  if (chapter.kind === "about") {
    return <AboutBody chapter={chapter} />
  }
  if (chapter.kind === "skills") {
    return <SkillsBody chapter={chapter} />
  }
  if (chapter.kind === "notes") {
    return <NotesBody chapter={chapter} />
  }
  if (chapter.kind === "list") {
    return <ListBody chapter={chapter} />
  }
  if (chapter.kind === "projects") {
    return <ProjectsBody chapter={chapter} />
  }
  if (chapter.kind === "certs") {
    return <CertsBody chapter={chapter} />
  }
  if (chapter.kind === "contact") {
    return <ContactBody chapter={chapter} />
  }
  return null
}

export function Story() {
  return (
    <>
      {profile.chapters.map((chapter) => (
        <ChapterView
          key={chapter.id}
          id={chapter.id}
          kicker={chapter.kicker}
          title={chapter.title}
          detail={chapter.kind === "about" ? "" : chapter.detail}
        >
          <ChapterBody chapter={chapter} />
        </ChapterView>
      ))}
    </>
  )
}
