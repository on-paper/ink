"use client";

import { ExternalLink, GitCommit, Sparkles } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useUpdates } from "@/src/components/updates/UpdatesContext";
import { cn } from "@/src/utils";

const BASE_COMMIT_SHA = "e7b39e070a88299cae6711c9ea5272bb5be5d9b2";

export default function ChangelogPage() {
  const { commits, changelogEntries, isLoading } = useUpdates();
  const [activeTab, setActiveTab] = useState("changelog");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading changelog...</div>
      </div>
    );
  }

  const renderChangelog = () => {
    if (changelogEntries.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No changelog entries yet. Check the commits tab for recent updates.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {[...changelogEntries].reverse().map((entry, index, reversedArray) => (
          <div key={entry.id} className="relative">
            {index < reversedArray.length - 1 && (
              <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-border/30" />
            )}

            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full glass border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <span className="text-sm font-bold text-purple-500">{entry.version || "1.0.0"}</span>
              </div>

              <div className="flex-1">
                <div className="glass rounded-lg p-6 border border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-bold mb-1">{entry.title}</h2>
                      <time className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">{entry.description}</p>

                  {entry.features && entry.features.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-2 text-green-500">✨ New Features</h3>
                      <ul className="space-y-1">
                        {entry.features.map((feature, i) => (
                          <li
                            key={`feature-${entry.id}-${i}`}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.fixes && entry.fixes.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-2 text-blue-500">🔧 Bug Fixes</h3>
                      <ul className="space-y-1">
                        {entry.fixes.map((fix, i) => (
                          <li
                            key={`fix-${entry.id}-${i}`}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.breaking && entry.breaking.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-2 text-red-500">⚠️ Breaking Changes</h3>
                      <ul className="space-y-1">
                        {entry.breaking.map((item, i) => (
                          <li
                            key={`breaking-${entry.id}-${i}`}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatCommitTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    }
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    }
    if (diffDays < 30) {
      return `${Math.floor(diffDays)}d`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderCommits = () => {
    // Filter commits to only show those after the base commit if needed
    const filteredCommits = commits;

    if (filteredCommits.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No commits to display.</p>
        </div>
      );
    }

    return (
      <div className="relative">
        {/* Vertical line connecting all commits */}
        <div className="absolute left-[3px] top-3 bottom-3 w-px bg-border/30" />

        <div className="space-y-1">
          {filteredCommits.map((commit, index) => (
            <div key={commit.sha} className="relative flex items-center gap-3 group">
              {/* Small dot on the timeline */}
              <div className="relative z-10 flex-shrink-0">
                <div className={cn("h-1.5 w-1.5 rounded-full", index === 0 ? "bg-purple-500" : "bg-foreground/40")} />
              </div>

              {/* Commit content - single line */}
              <div className="flex-1 flex items-center gap-3 py-1.5 min-w-0">
                {/* Commit message */}
                <p className="text-sm truncate flex-1 min-w-0 group-hover:text-foreground transition-colors">
                  {commit.message}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                  {/* Branch name */}
                  {commit.branch && commit.branch !== "main" && (
                    <span className="text-xs opacity-60">[{commit.branch}]</span>
                  )}

                  {/* Author avatar and name */}
                  <div className="flex items-center gap-1.5">
                    {commit.author.avatarUrl && (
                      <img
                        src={commit.author.avatarUrl}
                        alt={commit.author.username || commit.author.name}
                        className="h-4 w-4 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span className="hidden sm:inline">{commit.author.username || commit.author.name}</span>
                  </div>

                  {/* Timestamp */}
                  <span className="tabular-nums" title={new Date(commit.author.date).toLocaleString()}>
                    {formatCommitTime(commit.author.date)}
                  </span>

                  {/* Commit SHA with link */}
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {commit.sha}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* Base commit marker */}
          <div className="relative flex items-center gap-3 mt-2">
            <div className="relative z-10 flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-green-500/70" />
            </div>
            <div className="flex items-center gap-2 py-1.5">
              <p className="text-xs font-medium text-green-500/90">Initial Release</p>
              <span className="text-xs text-muted-foreground font-mono">{BASE_COMMIT_SHA.substring(0, 7)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-muted-foreground">Track all the updates, improvements, and fixes to Paper</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="changelog" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Releases
          </TabsTrigger>
          <TabsTrigger value="commits" className="flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            Commits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changelog" className="mt-0">
          {renderChangelog()}
        </TabsContent>

        <TabsContent value="commits" className="mt-0">
          {renderCommits()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
