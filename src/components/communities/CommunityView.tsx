"use client";

import type { Group } from "@cartel-sh/ui";
import Link from "~/components/Link";
import { formatChannelIdForUrl } from "~/utils";
import { Card, CardContent } from "../ui/card";
import { CommunityIcon } from "./CommunityIcon";

interface CommunityViewProps {
  community: Group;
  isVertical?: boolean;
}

export function CommunityView({ community, isVertical = false }: CommunityViewProps) {
  const communityUrl = `/c/${formatChannelIdForUrl(community.address)}`;

  return (
    <Link href={communityUrl} className="block ">
      <Card className="transition-colors cursor-pointer hover:bg-muted/30">
        <CardContent className="p-4 ">
          <div className={isVertical ? "flex flex-col items-center text-center" : "flex items-center gap-3"}>
            <div className="flex-shrink-0">
              <CommunityIcon community={community} size={"md"} />
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
