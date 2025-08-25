export default function Banner() {
  return (
    <section className="mb-16">
      <div className="space-y-4 text-gray-200 text-justify text-lg">
        <p className="leading-relaxed">
          Hi, I'm Shubhayan, a{' '}
          <a 
            href="https://www.cs.usc.edu/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="border-b border-dotted border-gray-400 hover:text-white hover:border-white hover:border-solid cursor-pointer transition-colors duration-200"
          >
            Computer Science student at USC
          </a>
          , where I spend my time building software solutions for relevant audiences.
          Currently, I'm working at{' '}
          <a 
            href="https://www.joinpogo.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="border-b border-dotted border-gray-400 hover:text-white hover:border-white hover:border-solid cursor-pointer transition-colors duration-200"
          >
            Pogo
          </a>
          , building at the intersection of allowing people to earn from their data through our consumer app
          and providing businesses with the ability to answer any business question instantly through this data pipeline.
        </p>

        <p className="leading-relaxed">
          I'm extremely grateful to say that things I've built have been used by and impacted 3M+ people.
          In high school, I developed AI solutions for the Indian government in reducing air pollution,
          currently used across 15+ cities to help policymakers make data-driven decisions on air pollution.
        </p>

        <p className="leading-relaxed">
          I lead recruitment at{' '}
          <a 
            href="https://www.troylabs.vc/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="border-b border-dotted border-gray-400 hover:text-white hover:border-white hover:border-solid cursor-pointer transition-colors duration-200"
          >
            USC's premier startup accelerator
          </a>
          {' '}and run{' '}
          <a 
            href="https://uscsep.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="border-b border-dotted border-gray-400 hover:text-white hover:border-white hover:border-solid cursor-pointer transition-colors duration-200"
          >
            USC's flagship incubator
          </a>
          , helping launch 14 companies this past year.
        </p>
      </div>
    </section>
  )
}