import { siteConfig, experienceData, projectsData, getBioPlainText } from "@/lib/data"

export function GET() {
  const bio = getBioPlainText()
  const lines = [
    "# agents.txt",
    "# Standard: https://agents-txt.com",
    "#",
    `# ${siteConfig.name} — Personal Portfolio`,
    `# Contact: ${siteConfig.email}`,
    `# GitHub: ${siteConfig.socials.github}`,
    `# LinkedIn: ${siteConfig.socials.linkedin}`,
    `# X: ${siteConfig.socials.x}`,
    "",
    "# === About ===",
    ...bio.map((line) => `# ${line}`),
    "",
    "# === Experience ===",
    ...experienceData.flatMap((exp) => [
      `# ${exp.company} — ${exp.position} (${exp.period})`,
      `#   ${exp.description}`,
      "#",
    ]),
    "",
    "# === Projects ===",
    ...projectsData.map(
      (proj) =>
        `# ${proj.title}${proj.badge ? ` [${proj.badge}]` : ""}: ${proj.description} (${proj.url})`
    ),
    "",
    "# No agent protocols are currently configured for this site.",
    "# This file is auto-generated from site data.",
    "",
  ]

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
