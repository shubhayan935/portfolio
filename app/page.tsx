"use client"

import { ClickSpark } from "@/components/click-spark"
import Header from "@/components/Header"
import Banner from "@/components/Banner"
import Experience from "@/components/Experience"
import Projects from "@/components/Projects"
import Footer from "@/components/Footer"
import { motion } from "framer-motion"

const fadeInUp = {
  initial: { 
    opacity: 0, 
    y: 20,
    filter: "blur(10px)"
  },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)"
  }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
}

export default function Home() {
  return (
    <ClickSpark sparkColor="#ffffff" sparkCount={12} sparkRadius={25} duration={500}>
      <div className="min-h-screen bg-black text-white">
        <Header />

        {/* Main Content */}
        <motion.main 
          className="pt-32 max-w-4xl mx-auto px-32"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Banner />
          </motion.div>
          
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Experience />
          </motion.div>
          
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Projects />
          </motion.div>
        </motion.main>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
        >
          <Footer />
        </motion.div>
      </div>
    </ClickSpark>
  )
}
