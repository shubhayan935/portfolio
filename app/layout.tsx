import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import Script from "next/script";

const garnett = localFont({
  src: [
    {
      path: "../public/fonts/Garnett-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Garnett-RegularItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/Garnett-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Garnett-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-garnett",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shubhayan Srivastava",
  description: "Shubhayan Srivastava's personal website",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${garnett.variable} ${instrumentSans.variable}`}>
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {/* SVG filter for subtle glass refraction */}
        <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
          <filter id="glass-refraction" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.5" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale={5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
