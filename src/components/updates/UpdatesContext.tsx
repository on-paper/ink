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
  commits: Commit[];
  changelogEntries: ChangelogEntry[];
  isLoading: boolean;
  error: Error | null;
  markAsViewed: () => void;
  refreshCommits: () => Promise<void>;
}

const UpdatesContext = createContext<UpdatesContextValue | undefined>(undefined);

const LAST_VISIT_KEY = "paper_last_visit";

export function UpdatesProvider({ children }: { children: ReactNode }) {
  const [lastVisit, setLastVisit] = useState<number | null>(null);
  const [newCommitsCount, setNewCommitsCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    if (stored) {
      setLastVisit(Number.parseInt(stored, 10));
    } else {
      const now = Date.now();
      localStorage.setItem(LAST_VISIT_KEY, now.toString());
      setLastVisit(now);
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

  const markAsViewed = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_VISIT_KEY, now.toString());
    setLastVisit(now);
    setNewCommitsCount(0);
  }, []);

  const refreshCommits = useCallback(async () => {
    await refetchCommits();
  }, [refetchCommits]);

  return (
    <UpdatesContext.Provider
      value={{
        lastVisit,
        newCommitsCount,
        commits: commitsData?.commits || [],
        changelogEntries: changelogData?.entries || [],
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
