import { siteConfig, type BioSegment } from "@/lib/data"

const linkClass =
  "border-b border-dotted border-gray-400 hover:text-white hover:border-white hover:border-solid cursor-pointer transition-colors duration-200"

function renderSegment(segment: BioSegment, index: number) {
  if (typeof segment === "string") {
    return <span key={index}>{segment}</span>
  }
  return (
    <a
      key={index}
      href={segment.href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {segment.text}
    </a>
  )
}

export default function Banner() {
  return (
    <section className="mb-16">
      <div className="space-y-4 text-gray-200 text-justify text-lg">
        {siteConfig.bio.map((paragraph, i) => (
          <p key={i} className="leading-relaxed">
            {paragraph.map(renderSegment)}
          </p>
        ))}
      </div>
    </section>
  )
}
