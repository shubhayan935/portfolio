import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Github, Mail, Linkedin, Twitter, ExternalLink, ChevronDown, Sun, Moon } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react';

// Animation variants
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
}

const staggerChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const slideIn: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

// Data
const socialLinks = [
  { 
    icon: Github, 
    href: "https://github.com/shubhayan935",
    label: "GitHub"
  },
  { 
    icon: Linkedin, 
    href: "https://linkedin.com/in/shubhayan935",
    label: "LinkedIn"
  },
  { 
    icon: Twitter, 
    href: "https://x.com/Shubhayan935",
    label: "Twitter"
  },
  { 
    icon: Mail, 
    href: "mailto:shubhaya@usc.edu",
    label: "Email"
  },
]

const workExperience = [
  {
    company: "Recei",
    role: "Software Engineer Intern",
    period: "Oct 2024 - Dec 2024",
    description:
      "Revolutionizing customer retention and relationships through dynamic digital receipts. Built a scalable business dashboard with AI-driven analytics and receipt customizations. Optimized APIs for receipt customization in Nest.js, reducing operational costs by 70% annually and contributing to a $150,000 increase in projected revenue through improved customer retention.",
    tags: ["React", "TypeScript", "Vite", "Nest.js", "AWS", "PostgreSQL"],
    logo: "/recei.jpeg"
  },
  {
    company: "ThoughtMinds",
    role: "Software Engineer Intern",
    period: "May 2024 - Aug 2024",
    description:
      "Developed a debugging agent for the company’s AI copilot product, reducing bug identification time by 170%. Implemented multi-agent architecture using LangGraph to efficiently locate bugs across codebases. Created Python scripts to analyze logger files and Jira, providing fixes aligned with clients’ code style guides.",
    tags: ["Python", "LangChain", "LangGraph", "Jira", "Docker"],
    logo: "/thoughtminds.jpeg"
  },
  {
    company: "USC Information Sciences Institute",
    role: "Undergraduate Research Assistant",
    period: "Jan 2024 - May 2024",
    description:
      "Assisted Prof. Fred Morstatter and 3 PhD candidates in the Operational Collective Intelligence project. Built and fine-tuned NLP models using VADER and BERT to predict stock prices from social media posts. Restructured algorithm using AutoTriggER to improve sentiment analysis & entity recognition accuracy by 27%.",
    tags: ["Python", "NLP", "BERT", "VADER", "AutoTriggER", "Matplotlib"],
    logo: "/usc_isi.png"
  },
  {
    company: "USC FormulaE Team",
    role: "EV Data Analytics Center Lead",
    period: "Sep 2023 - Jan 2024",
    description:
      "Set up the analytics environment using Raspberry Pis and motor sensors. Collected and analyzed data from performance tests of individual automotive components to improve overall vehicular performance. Worked on integrating the Dashboard Display with the Vehicle Control Unit via encoding and decoding through microcontrollers.",
    tags: ["Embedded C++", "Embedded Programming", "C", "Automotive Electronics", "Data Structures"],
    logo: "/sc_formula_electric.jpeg"
  },
  {
    company: "USC Annenberg Media",
    role: "Software Developer",
    period: "Sep 2023 - Dec 2023",
    description:
      "Collaborated with a team of 20 developers on optimizing user experience and improving efficiency of media search capabilities, including audio and video content. Conducted in-depth performance analysis, identified bottlenecks in media search algorithms, and implemented Hash Table and Rabin-Karp algorithms, reducing search times by up to 40%. Developed real-time news updating features with asynchronous JavaScript and XML while working closely with UI/UX designers.",
    tags: ["Software Development", "Data Structures", "Web Development", "AWS"],
    logo: "/usc_annenberg.jpeg"
  },
  {
    company: "ThoughtWorks",
    role: "Data Science Intern",
    period: "Dec 2021 - Mar 2022",
    description:
      "Worked on the AI4Bharat initiative’s Speech-to-Text project for over 47 Indian languages. Built a benchmarking dataset for Hindi ASR models from the ground up. Collected Hindi speech data by web-scraping open-source audio-visual content. Preprocessed and filtered data using SNR metrics and audio chunking. Developed and tested ASR models, leveraging Python packages like subprocess, IPython, numpy, and audio-processing libraries like wave, audioop, soundfile, and webrtcvad.",
    tags: ["Machine Learning", "Speech Recognition", "ASR Models", "Python", "TensorFlow", "Data Science"],
    logo: "/thoughtworks.jpeg"
  }
];


const projects = [
  {
    name: "Cortex",
    description: "A Secure Multi-Agent Reasoning and Action Engine. Cortex launches multiple task-based agents in parallel dynamically generated by a master planning agent.",
    url: "https://devpost.com/software/claude-cortex",
    image: "/cortex.png",
    achievement: "Anthropic Hackathon Winner"
  },
  {
    name: "Intervene",
    description: "OS level AI agent that takes over and completes tasks for you. Tell Intervene what to do, and it will do it for you.",
    url: "https://intervene-smoky.vercel.app",
    image: "/intervene.png",
    achievement: "8VC Hackathon Winner"
  },
  {
    name: "IdeaVine",
    description: "Multi-modal mindmapping tool designed to help you think freely. Let AI think with you, not for you.",
    url: "https://useideavine.com",
    image: "/ideavine.png",
    achievement: "1000+ active users"
  },
  {
    name: "Hera",
    description: "Air Pollution analytics tool that provides the best solution to the air pollution at the neighborhood level to policymakers.",
    url: "https://heradashboard.vercel.app",
    image: "/hera.png",
    achievement: "Used by the Indian Government"
  },
  {
    name: "AIlytics",
    description: "AI data scientist that connects directly to your databases and derives insights and visualizations through simple natural language prompts.",
    url: "https://github.com/shubhayan935/AIlytics",
    image: "/ailytics.png",
    // achievement: "Featured"
  },
  {
    name: "Tone",
    description: "Wear your wisdom. Tone captures your lived experiences, your conversations, your ideas, your  to-dos, automatically.",
    url: "https://tone.computer",
    image: "/tone.png",
    achievement: "384K+ views on X"
  },
]

// Components
// Theme toggle component
function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  )
}

function Navbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-0 py-4">
        <h1 className="text-4xl font-semibold">Shubhayan Srivastava</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {socialLinks.map((link) => (
            <button key={link.label} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                <link.icon className="h-5 w-5" />
                <span className="sr-only">{link.label}</span>
              </a>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

function Bio() {
  return (
    <motion.div 
      className="space-y-8 pb-16 pt-8 text-left font-instrument-sans"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <p className="text-md">
        I'm a Software Engineer and AI Researcher passionate about AI/ML, full-stack development, and intelligent systems. 
        Currently, I'm pursuing a{' '}
        <a 
            href="https://www.cs.usc.edu/"
            className="inline-flex border-b border-dotted border-foreground hover:border-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
          B.S. in Computer Science at USC
          </a>, where I work on building software solutions for relevent audiences.
      </p>

      <p>
          Among others, I've developed AI solutions for the Indian government in reducing air pollution,
          currently used across 15+ cities to help policymakers make data-driven decisions on air pollution, and 
          AI-powered debugging agents for enterprise engineering teams, revolutionizing bug detection 
          workflows with automated root-cause analysis.
        </p>
      
      <div className="space-y-6 text-base">
      <p>
          I lead recruitment at{' '}
          <a 
            href="https://troylabs.vc"
            className="inline-flex border-b border-dotted border-foreground hover:border-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            USC's premier student-run startup accelerator
          </a>, 
          bringing in new members across engineering, product management, UI/UX, marketing, and finance teams, 
          from a highly competitive pool of 300+ applicants. I also lead the{' '}
          <a 
            href="https://uscsep.com"
            className="inline-flex border-b border-dotted border-foreground hover:border-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            USC's flagship startup incubator
          </a>, 
          helping launch 10+ companies every semester.
        </p>

        <p>
          See more on my{' '}
          <a 
            href="https://drive.google.com/file/d/1gz2w1BofYXZ72t9wP4wwzPZoluBbbkXA/view?usp=sharing"
            className="inline-flex border-b border-dotted border-foreground hover:border-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            resume
          </a>,
          or reach out to me at{' '}
          <a 
            href="mailto:shubhaya@usc.edu"
            className="inline-flex border-b border-dotted border-foreground hover:border-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            shubhaya@usc.edu
          </a>.
        </p>
      </div>
    </motion.div>
  );
}

function WorkExperienceItem({ item }: { item: typeof workExperience[0] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      variants={slideIn}
      className="group bg-card-texture border border-border rounded-lg p-3 shadow-sm transition-transform hover:scale-[1.02]  font-instrument-sans"
    >
      <button
        className="relative flex w-full items-center justify-between gap-4 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          {/* Company Logo */}
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            <img src={item.logo} alt={`${item.company} logo`} className="h-full w-full object-cover" />
          </div>

          {/* Work Info */}
          <div className="flex flex-col">
            <h3 className="text-lg font-medium">{item.company}</h3>
            <p className="text-sm text-muted-foreground">{item.role}</p>
          </div>
        </div>

        {/* Period & Chevron */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {item.period}
          <ChevronDown
            className={`h-5 w-5 transition-opacity group-hover:opacity-100 ${
              isOpen ? 'rotate-180 opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </button>

      {/* Expanded Section */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto', marginTop: 16 },
              collapsed: { opacity: 0, height: 0, marginTop: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="mt-4 pl-16">
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Work Experience Section
function WorkExperience() {
  return (
    <motion.div
      className="space-y-8 pb-16 "
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 className="text-3xl font-semibold" variants={slideIn}>
        Work Experience
      </motion.h2>
      
      <motion.div className="space-y-4" variants={slideIn}>
        {workExperience.map((item) => (
          <WorkExperienceItem key={item.company} item={item} />
        ))}
      </motion.div>
    </motion.div>
  )
}

function Projects() {
  return (
    <motion.div
      className="space-y-8"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-3xl font-semibold"
        variants={slideIn}
      >
        Projects
      </motion.h2>
      <motion.div 
        className="grid gap-4 md:grid-cols-2 font-instrument-sans"
        variants={staggerChildren}
      >
        {projects.map((project) => (
          <motion.div key={project.name} variants={slideIn}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card-texture transition-colors hover:bg-accent"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={project.image}
                  alt={`Screenshot of ${project.name}`}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col p-6">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{project.name}</h3>
                    {project.achievement && (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                        {project.achievement}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="size-4 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            </a>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}


// Main App component
export default function App() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.05)_25%,rgba(68,68,68,.05)_50%,transparent_50%,transparent_75%,rgba(68,68,68,.05)_75%)] bg-[length:24px_24px]" />
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-24 md:px-0">
        <motion.section id="about" variants={fadeIn} initial="hidden" animate="visible">
          <Bio />
        </motion.section>
        <motion.section id="work" variants={fadeIn} initial="hidden" animate="visible">
          <WorkExperience />
        </motion.section>
        <motion.section id="projects" variants={fadeIn} initial="hidden" animate="visible">
          <Projects />
        </motion.section>
      </main>
      <Analytics />
    </div>
  )
}