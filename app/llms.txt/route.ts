import { siteConfig, experienceData, projectsData, getBioPlainText } from "@/lib/data"

export function GET() {
  const bio = getBioPlainText()
  const sections = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## About",
    ...bio.map((line) => `\n${line}`),
    "",
    "## Contact",
    `- Email: ${siteConfig.email}`,
    `- GitHub: ${siteConfig.socials.github}`,
    `- LinkedIn: ${siteConfig.socials.linkedin}`,
    `- X: ${siteConfig.socials.x}`,
    "",
    "## Experience",
    ...experienceData.map(
      (exp) =>
        `\n### ${exp.company} — ${exp.position} (${exp.period})\n${exp.description}`
    ),
    "",
    "## Projects",
    ...projectsData.map(
      (proj) =>
        `\n### ${proj.title}${proj.badge ? ` [${proj.badge}]` : ""}\n${proj.description}\nURL: ${proj.url}\nTech: ${proj.tags.join(", ")}`
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
