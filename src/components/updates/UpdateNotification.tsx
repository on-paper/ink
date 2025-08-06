"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { useUpdates } from "./UpdatesContext";

export function UpdateNotification() {
  const { newReleasesCount, newReleases, markAsViewed } = useUpdates();

  useEffect(() => {
    if (newReleasesCount > 0 && newReleases.length > 0) {
      const latestRelease = newReleases[0];
      
      toast(
        <Link href="/changelog" onClick={markAsViewed} className="block w-full">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm mb-1">
                New Release: v{latestRelease.version}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {latestRelease.title}
              </p>
              {newReleasesCount > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{newReleasesCount - 1} more release{newReleasesCount > 2 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </Link>,
        {
          duration: 8000,
          position: "top-right",
          className: "cursor-pointer hover:scale-[1.02] transition-transform",
        }
      );
    }
  }, [newReleasesCount, newReleases, markAsViewed]);

  return null;
}