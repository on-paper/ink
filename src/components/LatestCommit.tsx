"use client";

import { ExternalLink, GitCommitHorizontal } from "lucide-react";
import Link from "next/link";
import { useUpdates } from "~/components/updates/UpdatesContext";
import { getTimeAgo } from "~/utils/formatTime";

export function LatestCommit() {
  const { commits, isLoading } = useUpdates();
  const latestCommit = commits?.[0];

  if (isLoading || !latestCommit) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GitCommitHorizontal className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">Latest commit:</span>
      <a
        href={latestCommit.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 transition-colors inline-flex items-center gap-1"
      >
        {latestCommit.sha}
        <ExternalLink className="h-3 w-3" />
      </a>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground text-xs">{getTimeAgo(latestCommit.author.date)} ago</span>
      <span className="text-muted-foreground">•</span>
      <Link
        href="/changelog"
        className="text-xs hover:underline text-muted-foreground hover:text-foreground transition-colors"
      >
        View changelog
      </Link>
    </div>
  );
}
