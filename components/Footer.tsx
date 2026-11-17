import { VoxelBuilder, VoxelHeading } from "@/components/Voxel"

export default function Footer() {
  return (
    <footer className="pb-8 pt-8 text-gray-400 max-w-4xl mx-auto px-4 md:px-32">
      <section className="mb-10">
        <VoxelHeading className="text-white" color="#5cc160">Currently building world simulations</VoxelHeading>
        <p className="mt-2 mb-6 text-gray-400">Contribute to the world with your creations here.</p>
        <VoxelBuilder />
      </section>
      <p className="text-center">
        Made by Shubhayan with ❤️. If you're reading this,{' '}
        <a href="mailto:shubhaya@usc.edu" className="text-blue-400 hover:underline">
          let's chat!
        </a>
      </p>
    </footer>
  )
}
