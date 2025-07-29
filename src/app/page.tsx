import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paper",
  description: "reach your people on paper",
  openGraph: {
    title: "Paper",
    description: "reach your people on paper",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const LandingPage = () => {
  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col min-h-screen items-center justify-center relative z-10">
        <div className="text-3xl text-center drop-shadow-md dark:drop-shadow-glow">
          <h1>
            a <b>better</b> social
          </h1>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
