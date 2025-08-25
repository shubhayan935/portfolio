import React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { useState } from "react"
import Image from "next/image"

const experienceData = [
  {
    id: "pogo",
    company: "Pogo",
    position: "Engineering + Applied AI",
    period: "May 2025 - Present",
    logo: "/pogo_icon.jpeg",
    description: "Series A. Building the AI product suite across the B2B and B2C applications, serving 2.5M+ users."
  },
  {
    id: "recei",
    company: "Recei",
    position: "Software Engineer Intern",
    period: "Oct 2024 - Dec 2024",
    logo: "/recei_icon.jpeg",
    description: "Working on cutting-edge AI and software engineering projects, contributing to innovative solutions in the technology space with a focus on scalable systems and user experience."
  },
  {
    id: "thoughtminds",
    company: "ThoughtMinds",
    position: "Software Engineer Intern",
    period: "May 2024 - Aug 2024",
    logo: "/thoughtminds_icon.png",
    description: "Developed AI-powered debugging agents for enterprise engineering teams, revolutionizing bug detection workflows with automated root-cause analysis and improving development efficiency."
  },
  {
    id: "usc-isi",
    company: "USC Information Sciences Institute",
    position: "Undergraduate Research Assistant",
    period: "Jan 2024 - May 2024",
    logo: "/usc_isi_icon.jpg",
    description: "Conducted research in artificial intelligence and machine learning, contributing to cutting-edge projects in computer science and developing innovative solutions for complex technical challenges."
  },
  {
    id: "formula-e",
    company: "USC FormulaE Team",
    position: "EV Data Analytics Center Lead",
    period: "Sep 2023 - Jan 2024",
    logo: "/usc_formulaE_icon.jpeg",
    description: "Led data analytics initiatives for USC's Formula E racing team, developing performance tracking systems and analyzing vehicle telemetry data to optimize electric vehicle performance."
  },
  {
    id: "thoughtworks",
    company: "ThoughtWorks",
    position: "Data Science Intern",
    period: "Dec 2021 - Mar 2022",
    logo: "/thoughtworks_icon.jpg",
    description: "Worked on data science projects, analyzing large datasets and developing machine learning models to derive actionable business insights and support data-driven decision making."
  }
]

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
              className={`shimmer-card relative rounded-2xl p-2 transition-all duration-300 cursor-pointer hover:shadow-inner hover:shadow-white ${
                isOpen 
                  ? 'backdrop-blur-xl bg-white/5 shadow-2xl' 
                  : 'bg-transparent'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.05 }}
            >
              {/* Glass shine effect - only when open */}
              {isOpen && (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-2xl"></div>
                  <div className="glass-refraction rounded-2xl" />
                </>
              )}
            
            <AccordionItem value={experience.id} className={`transition-all duration-200 p-2`}>
              <AccordionTrigger className="px-0 py-0 hover:no-underline relative z-10 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <Image src={experience.logo} width={48} height={48} alt={`${experience.company} logo`} className="rounded-lg" />
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
                  {experience.description}
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