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
    id: "glance",
    company: "Glance",
    position: "Founding Engineer",
    period: "2025",
    logo: "/glance_icon.webp",
    description: "Glance is an automated documentation platform that captures workflows, meetings, and decisions in real-time to keep teams effortlessly aligned."
  },
  {
    id: "recei",
    company: "Recei",
    position: "Software Engineer Intern",
    period: "Oct 2024 - Dec 2024",
    logo: "/recei_icon.jpeg",
    description: "First engineering hire. Revolutionizing customer retention and relationships through dynamic digital receipts. Built a scalable business dashboard with AI-driven analytics and receipt customizations. Optimized APIs for receipt customization in Nest.js, reducing operational costs by 70% annually and contributing to a $150,000 increase in projected revenue through improved customer retention."
  },
  {
    id: "thoughtminds",
    company: "ThoughtMinds",
    position: "Software Engineer Intern",
    period: "May 2024 - Aug 2024",
    logo: "/thoughtminds_icon.png",
    description: "Developed AI-powered debugging agents for for the company’s AI copilot product, revolutionizing bug detection workflows with automated root-cause analysis and improving development efficiency."
  },
  {
    id: "usc-isi",
    company: "USC Information Sciences Institute",
    position: "Undergraduate Research Assistant",
    period: "Jan 2024 - May 2024",
    logo: "/usc_isi_icon.jpg",
    description: "Predicting stock prices from social media posts. Built and fine-tuned NLP models using VADER and BERT & restructured algorithm using AutoTriggER to improve sentiment analysis & entity recognition accuracy by 27%."
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
    description: "Worked on the AI4Bharat initiative’s Speech-to-Text project for over 47 Indian languages. Built a benchmarking dataset for ASR models from the ground up. Collected multilingual speech data by web-scraping open-source audio-visual content. Preprocessed and filtered data using SNR metrics and audio chunking. Developed and tested ASR models, leveraging Python packages like subprocess, IPython, numpy, and audio-processing libraries like wave, audioop, soundfile, and webrtcvad."
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