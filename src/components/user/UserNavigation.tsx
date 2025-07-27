"use client";

import { motion } from "framer-motion";
import { ImagesIcon, MessageCircle, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "~/components/Link";

export const UserNavigation = ({ handle }: { handle: string }) => {
  const pathname = usePathname();

  const tabs = [
    { href: `/u/${handle}`, label: "Posts", icon: MessageCircle },
    { href: `/u/${handle}/comments`, label: "Comments", icon: MessageSquare },
    { href: `/u/${handle}/gallery`, label: "Gallery", icon: ImagesIcon },
  ];

  const activeTab = tabs.findIndex((tab) => pathname === tab.href) || 0;

  return (
    <nav className="w-full z-[40] overflow-x-auto px-4 my-2">
      <div className="flex flex-row relative justify-around">
        {tabs.map((tab, _index) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative h-10 flex-1 overflow-hidden inline-flex gap-1.5 items-center justify-center text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {/* <Icon size={18} /> */}
              {tab.label}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  layoutId="activeTab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
