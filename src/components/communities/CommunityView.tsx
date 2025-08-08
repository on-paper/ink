"use client";

import type { Group } from "@cartel-sh/ui";
import { Users } from "lucide-react";
import Link from "~/components/Link";
import { resolveUrl } from "~/utils/resolveUrl";
import { Card, CardContent } from "../ui/card";

interface CommunityViewProps {
  community: Group;
  isVertical?: boolean;
}

export function CommunityView({ community, isVertical = false }: CommunityViewProps) {
  const communityUrl = `/c/${community.address}`;
  const iconUrl = resolveUrl(community.metadata?.icon);

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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
