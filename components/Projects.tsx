import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { projectsData } from "@/lib/data"

export default function Projects() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-normal mb-8 font-garnett">Cool Stuff I've Built</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projectsData.map((project) => (
          <a key={project.id} href={project.url} target="_blank" rel="noopener noreferrer">
            <Card className="h-full bg-[#0b0c0f] border-white/10 overflow-hidden hover:bg-[#0e1015] hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 cursor-pointer group gap-0 p-0">
              {/* Media */}
              <Image 
                src={project.imageUrl} 
                alt={project.title} 
                width={600} 
                height={400} 
                className="w-full h-40 object-cover"
              />

              {/* Body */}
              <CardContent className="p-6 flex flex-col h-full">
                {/* Title row with external link icon */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-normal text-white font-garnett">{project.title}</h3>
                  <ExternalLink className="size-4 text-white/70 group-hover:text-white transition-colors" />
                </div>

                {/* Badge */}
                {project.badge && (
                  <div className="mb-4">
                    <Badge className="text-[13px] font-medium rounded-md px-2 py-1 bg-white/15">{project.badge}</Badge>
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-300 mb-6 flex-grow leading-relaxed">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  )
}