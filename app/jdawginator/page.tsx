import type { Metadata } from "next"
import JdawginatorPage from "@/components/jdawginator/JdawginatorPage"

export const metadata: Metadata = {
  title: "JDAWGINATOR — Shubhayan Srivastava",
  description: "A live DJ set, played back inside an audio-reactive voxel club, followed by notes on the set.",
}

export default function Page() {
  return <JdawginatorPage />
}
