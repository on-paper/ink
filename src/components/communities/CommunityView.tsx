"use client";

import type { Group } from "@cartel-sh/ui";
import { Users } from "lucide-react";
import Link from "~/components/Link";
import { useUser } from "~/components/user/UserContext";
import { resolveUrl } from "~/utils/resolveUrl";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface CommunityViewProps {
  community: Group;
  isVertical?: boolean;
  showJoin?: boolean;
}

export function CommunityView({ community, isVertical = false, showJoin = true }: CommunityViewProps) {
  const communityUrl = `/c/${community.address}`;
  const iconUrl = resolveUrl(community.metadata?.icon);
  const canJoin = community.operations?.canJoin || false;
  const canLeave = community.operations?.canLeave || false;
  const { isAuthenticated } = useUser();

  const handleJoinLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link href={communityUrl} className="block ">
      <Card className="transition-colors cursor-pointer hover:bg-muted/30">
        <CardContent className="p-4 ">
          <div className={isVertical ? "flex flex-col items-center text-center" : "flex items-center gap-3"}>
            <div className="flex-shrink-0">
              {community.metadata?.icon ? (
                <img
                  src={iconUrl}
                  alt={community.metadata?.name || community.address}
                  className={isVertical ? "w-20 h-20 rounded-xl object-cover" : "w-12 h-12 rounded-xl object-cover"}
                />
              ) : (
                <div
                  className={
                    isVertical
                      ? "w-20 h-20 rounded-xl bg-secondary flex items-center justify-center"
                      : "w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"
                  }
                >
                  <Users className={isVertical ? "w-10 h-10 text-muted-foreground" : "w-6 h-6 text-muted-foreground"} />
                </div>
              )}
            </div>

            <div className={isVertical ? "mt-3" : "flex-1 min-w-0"}>
              <h3 className={isVertical ? "font-semibold text-base" : "font-semibold text-base truncate"}>
                {community.metadata?.name ||
                  `Community ${community.address.slice(0, 6)}...${community.address.slice(-4)}`}
              </h3>
            </div>

            {showJoin && isAuthenticated && (canJoin || canLeave) && (
              <Button
                size={isVertical ? "sm" : "default"}
                variant={canLeave ? "outline" : "default"}
                onClick={handleJoinLeave}
                className={isVertical ? "mt-3 w-full" : "flex-shrink-0 px-6"}
              >
                {canLeave ? "Leave" : "Join"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
