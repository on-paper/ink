"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isNavigatingFromHistoryAtom,
  navigationModeAtom,
  navigationPositionAtom,
  showNavigationIndicatorAtom,
} from "~/atoms/navigation";
import { recentlyVisitedPagesAtom } from "~/atoms/recentlyVisited";

export function HistoryIndicator() {
  const recentlyVisitedPages = useAtomValue(recentlyVisitedPagesAtom);
  const navigationPosition = useAtomValue(navigationPositionAtom);
  const [showIndicator, setShowIndicator] = useAtom(showNavigationIndicatorAtom);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const setNavigationMode = useSetAtom(navigationModeAtom);
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
            className="bg-background/80 backdrop-blur-md border rounded-2xl overflow-hidden cursor-pointer min-w-xs"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
              width: isHovered ? "auto" : "auto",
              height: isHovered ? "auto" : "auto",
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <AnimatePresence>
              {!isHovered ? (
                <motion.div
                  key="dots"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 py-2 flex items-center gap-1.5"
                >
                  {recentlyVisitedPages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-200 
                        ${index === navigationPosition ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-1 flex flex-col gap-1"
                >
                  {recentlyVisitedPages.map((page, index) => (
                    <button
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
                      <span className="text-sm truncate max-w-[200px] block">{page.title}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
