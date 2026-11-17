import { VoxelBuilder } from "@/components/Voxel"

export default function Footer() {
  return (
    <footer className="pb-8 pt-8 text-gray-400 max-w-4xl mx-auto px-4 md:px-32">
      <div className="mb-10">
        <VoxelBuilder />
      </div>
      <p className="text-center">
        Made by Shubhayan with ❤️. If you're reading this,{' '}
        <a href="mailto:shubhaya@usc.edu" className="text-blue-400 hover:underline">
          let's chat!
        </a>
      </p>
    </footer>
  )
}
