import type { Metadata } from "next";
import { generateDefaultOGUrl } from "~/utils/generateOGUrl";
import { LandingContent } from "../components/LandingContent";

const ogImageURL = generateDefaultOGUrl();

export const metadata: Metadata = {
  title: "Paper",
  description: "Permanent. Permissionless. Paper.",
  openGraph: {
    title: "Paper",
    description: "Permanent. Permissionless. Paper.",
    images: [ogImageURL],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paper",
    description: "Permanent. Permissionless. Paper.",
    images: [ogImageURL],
  },
};

export default function LandingPage() {
  return <LandingContent />;
}
