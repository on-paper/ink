"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiEthereum } from "react-icons/si";
import { LuGithub, LuGlobe } from "react-icons/lu";

const protocols = [
  {
    name: "Name Service",
    description: "Your web3 username"
  },
  {
    name: "Follow Protocol",
    description: "On-chain social graph for portable connections"
  },
  {
    name: "Comment Protocol",
    description: "Decentralized comments stored on Ethereum"
  }
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
      <div className="flex flex-col min-h-screen items-center justify-center relative z-10 gap-8">
        <div className="text-center space-y-2 mb-20">
          <p className="text-lg text-primary/10">Welcome, you have arrived just in time</p>
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight">
            <span className="text-primary/30">Permanent.</span>
            <span className="text-primary/50 ml-4">Permissionless.</span>
            <span className="ml-4 dark:text-white dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] drop-shadow-md">Paper.</span>
          </h1>
          <p className="text-lg text-primary/10">to Ethereum-native social</p>
        </div>

        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg p-4 pl-8 flex items-center gap-6">
              <SiEthereum className="text-4xl text-primary flex-shrink-0 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] drop-shadow-sm" />

              <div className="h-20 flex flex-col justify-center flex-1">
                <h3 className="text-xl font-bold text-left">
                  Ethereum{" "}
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={currentIndex}
                      className="inline-flex"
                    >
                      {protocols[currentIndex].name.split('').map((letter, index) => (
                        <motion.span
                          key={`${currentIndex}-${index}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.03,
                            ease: "easeInOut"
                          }}
                          className={letter === ' ' ? 'inline-block w-[0.25em]' : ''}
                        >
                          {letter}
                        </motion.span>
                      ))}
                    </motion.span>
                  </AnimatePresence>
                </h3>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-primary/60 text-left"
                  >
                    {protocols[currentIndex].description}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="rounded-lg p-4 pr-8 flex items-center gap-4 w-full md:w-auto">
                <div className="text-right">
                  <h3 className="text-lg font-bold">Fully open source</h3>
                  <p className="text-sm text-primary/60 text-right">
                    Every line of code{" "}
                    <a
                      href="https://github.com/ethos-community/paper"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      is open
                    </a>
                    {" "}and auditable
                  </p>
                </div>
                <LuGithub className="text-3xl text-primary flex-shrink-0 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] drop-shadow-sm" />
              </div>
            </div>

            <div className="rounded-lg p-4 flex items-center gap-4">
              <LuGlobe className="text-3xl text-primary flex-shrink-0 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] drop-shadow-sm" />
              <div>
                <h3 className="text-lg font-bold">Public goods</h3>
                <p className="text-sm text-primary/60">
                  No hidden fees, no data harvesting. Built for humanity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};