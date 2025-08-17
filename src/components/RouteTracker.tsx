"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isNavigatingFromHistoryAtom, navigationModeAtom, navigationPositionAtom } from "~/atoms/navigation";
import { addRecentlyVisitedCommunityAtom, addRecentlyVisitedPageAtom } from "~/atoms/recentlyVisited";

export function RouteTracker() {
  const pathname = usePathname();
  const addRecentlyVisited = useSetAtom(addRecentlyVisitedPageAtom);
  const addRecentlyVisitedCommunity = useSetAtom(addRecentlyVisitedCommunityAtom);
  const navigationMode = useAtomValue(navigationModeAtom);
  const isNavigatingFromHistory = useAtomValue(isNavigatingFromHistoryAtom);
  const setNavigationPosition = useSetAtom(navigationPositionAtom);

  useEffect(() => {
    if (navigationMode === "history" || isNavigatingFromHistory) {
      return;
    }

    setNavigationPosition(0);
    if (pathname === "/home") {
      addRecentlyVisited({
        path: pathname,
        title: "Home",
        type: "home",
      });
    } else if (pathname === "/communities") {
      addRecentlyVisited({
        path: pathname,
        title: "Communities",
        type: "communities",
      });
    } else if (pathname === "/activity") {
      addRecentlyVisited({
        path: pathname,
        title: "Activity",
        type: "activity",
      });
    } else if (pathname.startsWith("/c/")) {
      const communityId = pathname.split("/c/")[1];
      if (communityId) {
        addRecentlyVisited({
          path: pathname,
          title: `Community: ${communityId}`,
          type: "community",
          communityId,
        });
        addRecentlyVisitedCommunity(communityId);
      }
    } else if (pathname.startsWith("/u/")) {
      const userId = pathname.split("/u/")[1];
      if (userId && !userId.includes("/")) {
        addRecentlyVisited({
          path: pathname,
          title: `User: ${userId}`,
          type: "user",
          userId,
        });
      }
    }
  }, [
    pathname,
    addRecentlyVisited,
    addRecentlyVisitedCommunity,
    navigationMode,
    isNavigatingFromHistory,
    setNavigationPosition,
  ]);

  return null;
}
