"use client";

import { ArrowRight, ExternalLink, GitCommit } from "lucide-react";
import Link from "next/link";
import { cn } from "@/src/utils";
import { formatDate } from "@/src/utils/formatDate";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { useUpdates } from "./UpdatesContext";

interface ChangelogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogModal({ open, onOpenChange }: ChangelogModalProps) {
  const { commits, changelogEntries, isLoading } = useUpdates();

  const renderContent = () => {
    if (changelogEntries.length > 0) {
      return (
        <div className="space-y-6">
          {changelogEntries.map((entry) => (
            <div key={entry.id} className="relative">
              <div className="glass rounded-lg p-4 border border-border/50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold">{entry.title}</h3>
                  <time className="text-sm text-muted-foreground">{formatDate(entry.date, "MMM d, yyyy")}</time>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{entry.description}</p>

                {entry.features && entry.features.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-sm font-medium mb-1">Features</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {entry.features.map((feature, i) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.fixes && entry.fixes.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-sm font-medium mb-1">Fixes</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {entry.fixes.map((fix, i) => (
                        <li key={i}>{fix}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent" />
        <div className="space-y-4">
          {commits.map((commit, _index) => (
            <div key={commit.sha} className="relative flex items-start gap-4">
              <div
                className={cn(
                  "relative z-10 flex h-12 w-12 items-center justify-center rounded-full glass",
                  "border border-border/50 bg-background/50",
                )}
              >
                <GitCommit className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex-1 pt-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{commit.message}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{commit.author.username || commit.author.name}</span>
                      <span>{formatDate(commit.author.date, "MMM d")}</span>
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <span className="font-mono">{commit.sha}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] glass">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">What&apos;s New</DialogTitle>
          <DialogDescription>Recent updates and improvements to Paper</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading updates...</div>
            </div>
          ) : (
            renderContent()
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <Link href="/changelog">
            <Button variant="ghost" size="sm" className="gap-2">
              View full changelog
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button onClick={() => onOpenChange(false)} size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
