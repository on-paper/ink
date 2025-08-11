"use client";

import { Ban } from "lucide-react";
import type { CommunityWithOperations } from "~/hooks/useCommunity";
import { Card } from "../ui/card";
import { CommunityIcon } from "./CommunityIcon";

interface CommunityHeaderProps {
  community: CommunityWithOperations;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {

  return (
    <Card className="flex items-center gap-4 p-4 rounded-xl mb-4">
      <div className="flex-shrink-0">
        <CommunityIcon community={community} size="md" />
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold">
          {community.metadata?.name ||
            (community.address
              ? `Community ${community.address.slice(0, 6)}...${community.address.slice(-4)}`
              : "Unknown Community")}
        </h1>
        <div className="flex items-center gap-3 mt-1">
          {community.isBanned && (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <Ban size={14} />
              <span>You are banned from this community</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
