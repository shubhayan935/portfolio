import {
  siteConfig,
  experienceData,
  projectsData,
  writingData,
  getBioMarkdown,
  getExperienceDescriptionMarkdown,
} from "@/lib/data"

export function GET() {
  const bio = getBioMarkdown()
  const sections = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## About",
    ...bio.map((line) => `\n${line}`),
    "",
    "## Contact",
    `- Website: https://shubhayan.dev`,
    `- Email: ${siteConfig.email}`,
    `- GitHub: ${siteConfig.socials.github}`,
    `- LinkedIn: ${siteConfig.socials.linkedin}`,
    `- X: ${siteConfig.socials.x}`,
    "",
    "## Experience",
    ...experienceData.map(
      (exp) =>
        `\n### ${exp.company} — ${exp.position} (${exp.period})\n${getExperienceDescriptionMarkdown(exp.description)}`
    ),
    "",
    "## Projects",
    ...projectsData.map(
      (proj) =>
        `\n### ${proj.title}${proj.badge ? ` [${proj.badge}]` : ""}\n${proj.description}\nURL: ${proj.url}\nTech: ${proj.tags.join(", ")}`
    ),
    "",
    "## Writing",
    ...writingData.map(
      (writing) =>
        `\n### [${writing.title}](${writing.url}) (${writing.date})\n${writing.description}`
    ),
    "",
  ]

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
