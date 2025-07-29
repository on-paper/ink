"use client";

import Link from "~/components/Link";
import { useCommunity } from "~/hooks/useCommunity";
import { Skeleton } from "../ui/skeleton";
import { CommunityView } from "./CommunityView";

interface TrendingCommunitiesProps {
  communityAddresses: string[];
  showAll?: boolean;
}

function TrendingCommunityItem({ address, isVertical = true }: { address: string; isVertical?: boolean }) {
  const { data: community, isLoading } = useCommunity(address);

  if (isLoading) {
    return (
      <div className="flex-1">
        <Skeleton className={isVertical ? "h-[200px] rounded-xl" : "h-[80px] rounded-xl"} />
      </div>
    );
  }

  if (!community) {
    return null;
  }

  return (
    <div className="flex-1">
      <CommunityView community={community} isVertical={isVertical} showJoin={!isVertical} />
    </div>
  );
}

export function TrendingCommunities({ communityAddresses, showAll = false }: TrendingCommunitiesProps) {
  if (communityAddresses.length === 0) {
    return null;
  }

  const displayAddresses = showAll ? communityAddresses : communityAddresses.slice(0, 4);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Trending Communities</h2>
        {!showAll && communityAddresses.length > 4 && (
          <Link href="/communities/trending" className="text-sm text-muted-foreground hover:text-foreground">
            Show all
          </Link>
        )}
      </div>
      {showAll ? (
        <div className="space-y-4">
          {displayAddresses.map((address, index) => (
            <TrendingCommunityItem key={`${address}-${index}`} address={address} isVertical={false} />
          ))}
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="hidden lg:contents">
            {displayAddresses.map((address, index) => (
              <TrendingCommunityItem key={`${address}-${index}`} address={address} />
            ))}
          </div>
          <div className="contents lg:hidden">
            {displayAddresses.slice(0, 3).map((address, index) => (
              <TrendingCommunityItem key={`${address}-${index}`} address={address} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
