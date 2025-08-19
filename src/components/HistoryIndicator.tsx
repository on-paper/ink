"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isNavigatingFromHistoryAtom, navigationPositionAtom, showNavigationIndicatorAtom } from "~/atoms/navigation";
import { recentlyVisitedPagesAtom } from "~/atoms/recentlyVisited";

export function HistoryIndicator() {
  const recentlyVisitedPages = useAtomValue(recentlyVisitedPagesAtom);
  const navigationPosition = useAtomValue(navigationPositionAtom);
  const [showIndicator, setShowIndicator] = useAtom(showNavigationIndicatorAtom);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const setNavigationPosition = useSetAtom(navigationPositionAtom);
  const setIsNavigatingFromHistory = useSetAtom(isNavigatingFromHistoryAtom);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (showIndicator && !isHovered) {
      timeout = setTimeout(() => {
        setShowIndicator(false);
      }, 2000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [showIndicator, setShowIndicator, isHovered]);

  if (recentlyVisitedPages.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 left-4 z-50"
        >
          <motion.div
            data-history-indicator
            className="bg-background/80 backdrop-blur-md border rounded-2xl cursor-pointer min-w-[120px] overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
              width: isHovered ? 220 : 120,
              height: isHovered ? recentlyVisitedPages.length * 36 + 8 : 36,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              mass: 0.5,
            }}
          >
            <motion.div className="relative w-full h-full" animate={{ opacity: 1 }}>
              {!isHovered ? (
                <motion.div
                  className="absolute inset-0 px-3 py-1.5 flex items-center justify-center gap-1.5"
                  initial={false}
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {recentlyVisitedPages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-200 
                        ${index === navigationPosition ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </motion.div>
              ) : null}
              {isHovered ? (
                <motion.div
                  className="absolute inset-0 p-1 flex flex-col gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: 0.1 }}
                >
                  {recentlyVisitedPages.map((page, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => {
                        setIsNavigatingFromHistory(true);
                        setNavigationPosition(index);
                        router.push(page.path);

                        setTimeout(() => {
                          setIsNavigatingFromHistory(false);
                        }, 100);
                      }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors w-full text-left
                        ${index === navigationPosition ? "bg-muted/50" : "hover:bg-muted/30"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200 
                          ${index === navigationPosition ? "bg-primary" : "bg-muted"}`}
                      />
                      <span className="text-sm truncate max-w-[180px] block">{page.title}</span>
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
