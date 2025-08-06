"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LuGithub, LuGlobe, LuHandCoins, LuLock, LuZap } from "react-icons/lu";
import { SiEthereum } from "react-icons/si";

const protocols = [
  {
    name: "Name Service",
    description: "Your web3 username",
  },
  {
    name: "Follow Protocol",
    description: "On-chain social graph for portable connections",
  },
  {
    name: "Comment Protocol",
    description: "Decentralized comments stored on Ethereum",
  },
];

export const LandingContent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % protocols.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col min-h-screen items-center justify-start relative z-10 gap-40 py-20 px-4">
        {/* Section 1: Header */}
        <div className="text-center space-y-2">
          <p className="text-lg text-primary/10">Welcome, you have arrived just in time</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex flex-col sm:flex-row sm:justify-center items-center">
            <span className="text-primary/30">Permanent.</span>
            <span className="text-primary/50 sm:ml-4">Permissionless.</span>
            <span className="sm:ml-4 dark:text-white dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] drop-shadow-md">
              Paper.
            </span>
          </h1>
          <p className="text-lg text-primary/10">to Ethereum-native social</p>
        </div>

        {/* Section 2: Cards */}
        <div className="w-full max-w-xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg p-4 pl-8 flex items-center gap-6">
              <SiEthereum className="text-4xl text-primary flex-shrink-0 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] drop-shadow-sm" />

              <div className="h-20 flex flex-col justify-center flex-1">
                <h3 className="text-xl font-bold text-left whitespace-nowrap flex items-baseline">
                  <span>Ethereum</span>
                  <span className="ml-[5px]"> </span>
                  <span className="relative inline-flex" style={{ minWidth: "160px" }}>
                    <AnimatePresence>
                      <motion.span
                        key={currentIndex}
                        className="inline-flex"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, position: "absolute", left: 0, top: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {protocols[currentIndex].name.split("").map((letter, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                              duration: 0.3,
                              delay: index * 0.03,
                              ease: "easeInOut",
                            }}
                            className="inline-block"
                            style={{ width: letter === " " ? "0.25em" : "auto" }}
                          >
                            {letter}
                          </motion.span>
                        ))}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </h3>
                <div className="relative h-5">
                  <AnimatePresence>
                    <motion.p
                      key={currentIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-primary/60 text-left absolute left-0 top-0"
                    >
                      {protocols[currentIndex].description}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="rounded-lg p-4 pr-8 flex items-center gap-4 w-full md:w-auto">
                <div className="text-right">
                  <h3 className="text-lg font-bold">Fully open source</h3>
                  <p className="text-sm text-primary/60 text-right">
                    Every line of code{" "}
                    <a
                      href="https://github.com/on-paper/ink"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline underline-offset-2"
                    >
                      is open
                    </a>{" "}
                    and auditable
                  </p>
                </div>
                <LuGithub className="text-3xl text-primary flex-shrink-0 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] drop-shadow-sm" />
              </div>
            </div>

            <div className="rounded-lg p-4 pl-8 flex items-center gap-4">
              <LuGlobe className="text-3xl text-primary flex-shrink-0 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] drop-shadow-sm" />
              <div>
                <h3 className="text-lg font-bold">Public goods</h3>
                <p className="text-sm text-primary/60">No hidden fees, no data harvesting. Built for humanity.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Closing content */}
        <div className="w-full">
          <div className="max-w-xl mx-auto mb-12">
            <p className="text-xl text-primary">You'll love it.</p>
            <p className="text-xl text-primary/60">It's never been easier to communicate on-chain.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-2xl mx-auto">
            <div className="relative">
              <LuZap
                className="absolute -top-12 -left-12 text-7xl text-primary -z-10"
                style={{ filter: "opacity(0.2)" }}
              />
              <p className="text-base relative">
                <span className="text-primary font-semibold">Fast</span>
                <span className="text-primary/60">. Inherits speed of any ethereum L2 it's deployed on</span>
              </p>
            </div>

            <div className="relative">
              <LuHandCoins
                className="absolute -top-12 -left-12 text-7xl text-primary -z-10"
                style={{ filter: "opacity(0.2)" }}
              />
              <p className="text-base relative">
                <span className="text-primary font-semibold">Cheap</span>
                <span className="text-primary/60">
                  . Posting costs &lt;$0.01 and the price is going down as ethereum continues to scale
                </span>
              </p>
            </div>

            <div className="relative">
              <LuLock
                strokeWidth={2.5}
                className="absolute -top-12 -left-12 text-7xl text-primary -z-10"
                style={{ filter: "opacity(0.2)", transform: "scaleX(0.85)" }}
              />
              <p className="text-base relative">
                <span className="text-primary font-semibold">Secure</span>
                <span className="text-primary/60">. Your content lives directly on chain and is forever available</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
