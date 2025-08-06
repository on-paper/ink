"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    username: string | null;
    date: string;
    avatarUrl: string | null;
  };
  branch: string | null;
  isMerge: boolean;
  url: string;
}

interface ChangelogEntry {
  id: string;
  version?: string;
  title: string;
  description: string;
  fromCommit: string;
  toCommit: string;
  date: string;
  features?: string[];
  fixes?: string[];
  breaking?: string[];
  changes?: string[];
  commits?: {
    from: string;
    to: string;
  };
}

interface UpdatesContextValue {
  lastVisit: number | null;
  newCommitsCount: number;
  newReleasesCount: number;
  commits: Commit[];
  changelogEntries: ChangelogEntry[];
  newReleases: ChangelogEntry[];
  isLoading: boolean;
  error: Error | null;
  markAsViewed: () => void;
  refreshCommits: () => Promise<void>;
}

const UpdatesContext = createContext<UpdatesContextValue | undefined>(undefined);

const LAST_VISIT_KEY = "paper_last_visit";
const LAST_RELEASE_KEY = "paper_last_release_version";

export function UpdatesProvider({ children }: { children: ReactNode }) {
  const [lastVisit, setLastVisit] = useState<number | null>(null);
  const [newCommitsCount, setNewCommitsCount] = useState(0);
  const [newReleasesCount, setNewReleasesCount] = useState(0);
  const [newReleases, setNewReleases] = useState<ChangelogEntry[]>([]);
  const [lastReleaseVersion, setLastReleaseVersion] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    if (stored) {
      setLastVisit(Number.parseInt(stored, 10));
    } else {
      const now = Date.now();
      localStorage.setItem(LAST_VISIT_KEY, now.toString());
      setLastVisit(now);
    }
    
    const storedRelease = localStorage.getItem(LAST_RELEASE_KEY);
    if (storedRelease) {
      setLastReleaseVersion(storedRelease);
    }
  }, []);

  const {
    data: commitsData,
    isLoading: commitsLoading,
    error: commitsError,
    refetch: refetchCommits,
  } = useQuery({
    queryKey: ["github-commits"],
    queryFn: async () => {
      const response = await fetch("/api/changelog");
      if (!response.ok) {
        throw new Error("Failed to fetch commits");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: changelogData } = useQuery({
    queryKey: ["changelog-entries"],
    queryFn: async () => {
      const response = await fetch("/changelog.json");
      if (!response.ok) {
        return { entries: [] };
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (commitsData?.commits && lastVisit) {
      const newCommits = commitsData.commits.filter((commit: Commit) => {
        const commitDate = new Date(commit.author.date).getTime();
        return commitDate > lastVisit;
      });
      setNewCommitsCount(newCommits.length);
    }
  }, [commitsData, lastVisit]);

  useEffect(() => {
    if (changelogData?.entries && changelogData.entries.length > 0) {
      const latestRelease = changelogData.entries[0];
      
      if (!lastReleaseVersion) {
        // First time user - mark the latest version as seen
        localStorage.setItem(LAST_RELEASE_KEY, latestRelease.version || "1.0.0");
        setLastReleaseVersion(latestRelease.version || "1.0.0");
        setNewReleases([]);
        setNewReleasesCount(0);
      } else if (latestRelease.version && latestRelease.version !== lastReleaseVersion) {
        // Find all new releases since last seen version
        const newRels = [];
        for (const entry of changelogData.entries) {
          if (entry.version === lastReleaseVersion) break;
          if (entry.version) newRels.push(entry);
        }
        setNewReleases(newRels);
        setNewReleasesCount(newRels.length);
      }
    }
  }, [changelogData, lastReleaseVersion]);

  const markAsViewed = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_VISIT_KEY, now.toString());
    setLastVisit(now);
    setNewCommitsCount(0);
    
    // Also mark the latest release as viewed
    if (changelogData?.entries && changelogData.entries.length > 0) {
      const latestRelease = changelogData.entries[0];
      if (latestRelease.version) {
        localStorage.setItem(LAST_RELEASE_KEY, latestRelease.version);
        setLastReleaseVersion(latestRelease.version);
        setNewReleases([]);
        setNewReleasesCount(0);
      }
    }
  }, [changelogData]);

  const refreshCommits = useCallback(async () => {
    await refetchCommits();
  }, [refetchCommits]);

  return (
    <UpdatesContext.Provider
      value={{
        lastVisit,
        newCommitsCount,
        newReleasesCount,
        commits: commitsData?.commits || [],
        changelogEntries: changelogData?.entries || [],
        newReleases,
        isLoading: commitsLoading,
        error: commitsError as Error | null,
        markAsViewed,
        refreshCommits,
      }}
    >
      {children}
    </UpdatesContext.Provider>
  );
}

export function useUpdates() {
  const context = useContext(UpdatesContext);
  if (!context) {
    throw new Error("useUpdates must be used within UpdatesProvider");
  }
  return context;
}
