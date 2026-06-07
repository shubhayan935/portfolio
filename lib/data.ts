export type BioSegment = string | { text: string; href: string }

export const siteConfig = {
  name: "Shubhayan Srivastava",
  title: "Shubhayan Srivastava",
  description: "Shubhayan Srivastava's personal website",
  email: "shubhaya@usc.edu",
  socials: {
    github: "https://github.com/shubhayan935",
    linkedin: "https://linkedin.com/in/shubhayan935",
    x: "https://x.com/Shubhayan935",
  },
  bio: [
    [
      "Hi, I'm Shubhayan, ",
      { text: "studying CS at USC", href: "https://www.cs.usc.edu/" },
      ", where I spend most of my time in product, engineering and design. Currently, I work at ",
      { text: "Ramp", href: "https://www.ramp.com/" },
      ", building agentic procurement for 70,000+ businesses.",
    ],
    [
      "I'm extremely grateful to say that the things I've built have been collectively used by and impacted 5M+ people. Previously, I was one of 2 engineers building the AI Qual product from the ground up at ",
      { text: "Pogo", href: "https://www.joinpogo.com/" },
      ", serving customers like Uber and Point72. In high school, I developed AI solutions for the Indian government in reducing air pollution, currently used across 15+ cities to help policymakers make data-driven decisions on air pollution.",
    ],
    [
      "I lead recruitment at ",
      { text: "USC's premier startup accelerator", href: "https://www.troylabs.vc/" },
      " and ran ",
      { text: "USC's flagship incubator", href: "https://uscsep.com/" },
      ", helping launch 14 companies out of USC's startup ecosystem.",
    ],
  ] as BioSegment[][],
}

export function getBioPlainText(): string[] {
  return siteConfig.bio.map((paragraph) =>
    paragraph
      .map((segment) => (typeof segment === "string" ? segment : segment.text))
      .join("")
  )
}

export const experienceData = [
  {
    id: "ramp",
    company: "Ramp",
    position: "Engineering + Product",
    period: "May 2026 - Present",
    logo: "/ramp_icon.png",
    description:
      "Agentic Procurement for 70,000+ businesses, serving $100B in transaction volume.",
  },
  {
    id: "pogo",
    company: "Pogo",
    position: "Engineering + Applied AI",
    period: "May 2025 - May 2026",
    logo: "/pogo_icon.jpeg",
    description:
      "Series B. Building the AI product suite across the B2B and B2C applications, serving 3M+ users. At the intersection of allowing people to earn from their data through our consumer app and providing businesses with the ability to answer any business question instantly through this data pipeline.",
  },
  {
    id: "glance",
    company: "Glance",
    position: "Founding Engineer",
    period: "2025",
    logo: "/glance_icon.webp",
    description:
      "Glance is an automated documentation platform that captures workflows, meetings, and decisions in real-time to keep teams effortlessly aligned. Built product features including core context engine, Live-RAG pipeline and AWS S3 integration",
  },
  {
    id: "recei",
    company: "Recei",
    position: "Software Engineer Intern",
    period: "Oct 2024 - Dec 2024",
    logo: "/recei_icon.jpeg",
    description:
      "First engineering hire. Revolutionizing customer retention and relationships through dynamic digital receipts. Built a scalable business dashboard with AI-driven analytics and receipt customizations. Optimized APIs for receipt customization in Nest.js, reducing operational costs by 70% annually and contributing to a $150,000 increase in projected revenue through improved customer retention.",
  },
  {
    id: "thoughtminds",
    company: "ThoughtMinds",
    position: "Software Engineer Intern",
    period: "May 2024 - Aug 2024",
    logo: "/thoughtminds_icon.png",
    description:
      "Developed AI-powered debugging agents for for the company's AI copilot product, revolutionizing bug detection workflows with automated root-cause analysis and improving development efficiency.",
  },
  {
    id: "usc-isi",
    company: "USC Information Sciences Institute",
    position: "Undergraduate Research Assistant",
    period: "Jan 2024 - May 2024",
    logo: "/usc_isi_icon.jpg",
    description:
      "Predicting stock prices from social media posts. Built and fine-tuned NLP models using VADER and BERT & restructured algorithm using AutoTriggER to improve sentiment analysis & entity recognition accuracy by 27%.",
  },
  {
    id: "formula-e",
    company: "USC FormulaE Team",
    position: "EV Data Analytics Center Lead",
    period: "Sep 2023 - Jan 2024",
    logo: "/usc_formulaE_icon.jpeg",
    description:
      "Led data analytics initiatives for USC's Formula E racing team, developing performance tracking systems and analyzing vehicle telemetry data to optimize electric vehicle performance.",
  },
  {
    id: "thoughtworks",
    company: "ThoughtWorks",
    position: "Data Science Intern",
    period: "Dec 2021 - Mar 2022",
    logo: "/thoughtworks_icon.jpg",
    description:
      "Worked on the AI4Bharat initiative's Speech-to-Text project for over 47 Indian languages. Built a benchmarking dataset for ASR models from the ground up. Collected multilingual speech data by web-scraping open-source audio-visual content. Preprocessed and filtered data using SNR metrics and audio chunking. Developed and tested ASR models, leveraging Python packages like subprocess, IPython, numpy, and audio-processing libraries like wave, audioop, soundfile, and webrtcvad.",
  },
]

export const projectsData = [
  {
    id: "cortex",
    title: "Cortex",
    url: "https://devpost.com/software/claude-cortex",
    imageUrl: "/cortex.png",
    badge: "Anthropic Hackathon Winner",
    badgeColor: "bg-yellow-500 text-black",
    description:
      "A secure multi-agent reasoning and action engine. Cortex launches multiple task-based agents in parallel dynamically generated by a master planning agent.",
    tags: ["Claude + AWS Bedrock", "Nextjs", "FastAPI", "Pydantic"],
  },
  {
    id: "intervene",
    title: "Intervene",
    url: "https://intervene-smoky.vercel.app",
    imageUrl: "/intervene.png",
    badge: "8VC Hackathon Winner",
    badgeColor: "bg-yellow-500 text-black",
    description:
      "OS level AI agent that takes over and completes tasks for you. Tell Intervene what to do, and it will do it for you, autonomously in the background.",
    tags: ["Langchain", "Swift for MacOS", "FastAPI", "Llama + Llava"],
  },
  {
    id: "ideavine",
    title: "IdeaVine",
    url: "https://useideavine.com",
    imageUrl: "/ideavine.png",
    badge: "1000+ Active Users",
    badgeColor: "bg-yellow-500 text-black",
    description:
      "Multi-modal mindmapping tool designed to help you think freely. Let AI think with you, not for you.",
    tags: ["MongoDB", "Nextjs", "Whisper", "Socket.io", "OpenAI", "Redis"],
  },
  {
    id: "hera",
    title: "Hera",
    url: "https://heradashboard.vercel.app",
    imageUrl: "/hera.png",
    badge: "Used by the Indian Government",
    badgeColor: "bg-yellow-500 text-black",
    description:
      "Air Pollution analytics tool that provides the best solution to the air pollution at the neighborhood level to policymakers.",
    tags: ["PostgreSQL", "Python", "React", "Kriging", "Data Augmentation"],
  },
  {
    id: "tone",
    title: "Tone",
    url: "https://tone.computer",
    imageUrl: "/tone.png",
    badge: "384K+ Views on X",
    badgeColor: "bg-yellow-500 text-black",
    description:
      "Wear your wisdom. Tone captures your lived experiences, your conversations, your ideas, your to-dos, automatically.",
    tags: ["SwiftUI", "Xcode", "Pinecone", "Supabase", "Structured Memory"],
  },
  {
    id: "ailytics",
    title: "AIlytics",
    url: "https://github.com/shubhayan935/AIlytics",
    imageUrl: "/ailytics.png",
    badge: "Enterprise Pilot Users",
    badgeColor: null,
    description:
      "AI data scientist that connects directly to your databases and derives insights and visualizations through simple natural language prompts.",
    tags: [
      "Apache Spark",
      "Neo4j",
      "Langchain",
      "Reinforcement Learning",
      "Docker",
    ],
  },
]
