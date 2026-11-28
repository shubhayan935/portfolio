import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/jdawginator", destination: "/writing/jdawginator", permanent: true },
    ]
  },
};

export default nextConfig;
