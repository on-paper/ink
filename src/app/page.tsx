
import type { Metadata } from "next";
import { LandingContent } from "../components/LandingContent";

export const metadata: Metadata = {
  title: "Paper",
  description: "Permanent. Permissionless. Paper.",
  openGraph: {
    title: "Paper",
    description: "Permanent. Permissionless. Paper.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function LandingPage() {
  return <LandingContent />;
}
