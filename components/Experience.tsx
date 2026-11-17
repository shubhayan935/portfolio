import React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { useState } from "react"
import Image from "next/image"
import { Link as LinkIcon } from "lucide-react"
import { experienceData, type BioSegment } from "@/lib/data"

const linkClass =
  "border-b border-dotted border-gray-400 hover:text-white hover:border-white hover:border-solid cursor-pointer transition-colors duration-200"

function renderDescriptionSegment(segment: BioSegment, index: number) {
  if (typeof segment === "string") return <React.Fragment key={index}>{segment}</React.Fragment>

  return (
    <a
      key={index}
      href={segment.href}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
      aria-label={segment.text}
    >
      {segment.iconOnly ? <LinkIcon aria-hidden="true" className="inline-block size-3.5" /> : segment.text}
    </a>
  )
}

export default function Experience() {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined)

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-normal mb-4 font-garnett">Work</h2>

      <Accordion 
        type="single" 
        collapsible 
        className="space-y-0"
        value={openItem}
        onValueChange={setOpenItem}
      >
        {experienceData.map((experience, index) => {
          const isOpen = openItem === experience.id
          return (
            <React.Fragment key={experience.id}>
            <motion.div
              className={`relative p-2 transition-all duration-200 cursor-pointer voxel-row ${
                isOpen 
                  ? 'voxel-row-open' 
                  : 'bg-transparent'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.05 }}
            >
              
            
            <AccordionItem value={experience.id} className={`transition-all duration-200 p-2`}>
              <AccordionTrigger className="px-0 py-0 hover:no-underline relative z-10 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <Image src={experience.logo} width={48} height={48} alt={`${experience.company} logo`} className="rounded-none" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-normal text-white font-garnett">{experience.company}</h3>
                      <p className="text-gray-400">{experience.position}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">{experience.period}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-6 pb-0 relative z-10">
                <p className="text-gray-300 text-[15px]">
                  {typeof experience.description === "string"
                    ? experience.description
                    : experience.description.map(renderDescriptionSegment)}
                </p>
              </AccordionContent>
            </AccordionItem>
            </motion.div>
            {/* Dotted separator - don't show after last item or when current/next item is open */}
            {index < experienceData.length - 1 && 
             !isOpen && 
             openItem !== experienceData[index + 1]?.id && (
              <div className="flex justify-center my-0">
                <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              </div>
            )}
          </React.Fragment>
          )
        })}
      </Accordion>
    </section>
  )
}
