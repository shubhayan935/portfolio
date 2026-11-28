import type { Metadata } from "next"
import JdawginatorPage from "@/components/jdawginator/JdawginatorPage"

export const metadata: Metadata = {
  title: "JDAWGINATOR — Shubhayan Srivastava",
  description: "Teaching an audio-native model to DJ with RL, a deterministic CDJ harness, and a verifiable DSP critic—played live inside an audio-reactive voxel club.",
}

export default function Page() {
  return <JdawginatorPage />
}
