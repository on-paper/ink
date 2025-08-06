"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/src/utils";
import { Button } from "../ui/button";
import { ChangelogModal } from "./ChangelogModal";
import { useUpdates } from "./UpdatesContext";

export function UpdateNotification() {
  const { newCommitsCount, markAsViewed } = useUpdates();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (newCommitsCount === 0) return null;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    markAsViewed();
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed top-4 right-4 z-50"
        >
          <Button
            onClick={handleOpenModal}
            className={cn(
              "glass rounded-full px-4 py-2 flex items-center gap-2",
              "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
              "border-purple-500/20 hover:border-purple-500/40",
              "shadow-lg shadow-purple-500/10",
              "transition-all duration-300 hover:scale-105",
            )}
            variant="outline"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
            </motion.div>
            <span className="text-sm font-medium">
              {newCommitsCount} new update{newCommitsCount > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted-foreground">View changelog</span>
          </Button>
        </motion.div>
      </AnimatePresence>

      <ChangelogModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
