import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface RecentlyVisitedPage {
  path: string;
  title: string;
  type: "home" | "communities" | "community" | "activity" | "user";
  communityId?: string;
  userId?: string;
  timestamp: number;
}

const defaultPages: RecentlyVisitedPage[] = [
  {
    path: "/home",
    title: "Home",
    type: "home",
    timestamp: Date.now() - 2000,
  },
  {
    path: "/communities",
    title: "Communities",
    type: "communities",
    timestamp: Date.now() - 1000,
  },
  {
    path: "/activity",
    title: "Activity",
    type: "activity",
    timestamp: Date.now(),
  },
];

export const recentlyVisitedPagesAtom = atomWithStorage<RecentlyVisitedPage[]>("recently-visited-pages", defaultPages);

export const addRecentlyVisitedPageAtom = atom(null, (get, set, newPage: Omit<RecentlyVisitedPage, "timestamp">) => {
  const currentPages = get(recentlyVisitedPagesAtom);
  const pageWithTimestamp: RecentlyVisitedPage = {
    ...newPage,
    timestamp: Date.now(),
  };

  const filteredPages = currentPages.filter((page) => !(page.path === newPage.path));

  const updatedPages = [pageWithTimestamp, ...filteredPages];

  if (updatedPages.length > 10) {
    updatedPages.pop();
  }

  set(recentlyVisitedPagesAtom, updatedPages);
});

export const clearRecentlyVisitedPagesAtom = atom(null, (_get, set) => {
  set(recentlyVisitedPagesAtom, []);
});

export const recentlyVisitedCommunitiesAtom = atomWithStorage<string[]>("recently-visited-communities", []);

export const addRecentlyVisitedCommunityAtom = atom(null, (get, set, communityId: string) => {
  const currentCommunities = get(recentlyVisitedCommunitiesAtom);

  const filteredCommunities = currentCommunities.filter((id) => id !== communityId);

  const updatedCommunities = [communityId, ...filteredCommunities];

  if (updatedCommunities.length > 10) {
    updatedCommunities.pop();
  }

  set(recentlyVisitedCommunitiesAtom, updatedCommunities);
});

export const clearRecentlyVisitedCommunitiesAtom = atom(null, (_get, set) => {
  set(recentlyVisitedCommunitiesAtom, []);
});
