"use client";

import { Ban, Users } from "lucide-react";
import { useUser } from "~/components/user/UserContext";
import type { CommunityWithOperations } from "~/hooks/useCommunity";
import { resolveUrl } from "~/utils/resolveUrl";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface CommunityHeaderProps {
  community: CommunityWithOperations;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
  const iconUrl = resolveUrl(community.metadata?.icon);
  const canJoin = community.canJoin || false;
  const canLeave = community.canLeave || false;
  const { isAuthenticated } = useUser();

  const handleJoinLeave = () => {};

  return (
    <Card className="flex items-center gap-4 p-4 rounded-xl mb-4">
      <div className="flex-shrink-0">
        {community.metadata?.icon ? (
          <img
            src={iconUrl}
            alt={community.metadata?.name || community.address}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
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

      {isAuthenticated && (canJoin || canLeave) && (
        <Button variant={canLeave ? "outline" : "default"} onClick={handleJoinLeave} className="px-6">
          {canLeave ? "Leave" : "Join"}
        </Button>
      )}
    </Card>
  );
}
