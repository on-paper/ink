"use client";

import { CommunityHeader } from "~/components/communities/CommunityHeader";
import { CommunityNavigation } from "~/components/communities/CommunityNavigation";
import { FeedSuspense } from "~/components/FeedSuspense";
import { Card, CardContent } from "~/components/ui/card";
import { useCommunity } from "~/hooks/useCommunity";

interface CommunityAboutPageProps {
  params: {
    community: string;
  };
}

export default function CommunityAboutPage({ params }: CommunityAboutPageProps) {
  const { data: community, isLoading, error } = useCommunity(params.community);

  if (isLoading) {
    return (
      <div className="z-[30] p-4 py-0">
        <div className="pt-4">
          <FeedSuspense />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="z-[30] p-4 py-0">
        <div className="pt-4">
          <div className="text-center text-muted-foreground">Community not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="z-[30] p-4 py-0">
      <div className="pt-4">
        <CommunityHeader community={community} />
        <CommunityNavigation communityAddress={params.community} />

        <Card className="glass">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>

            {community.metadata?.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-base">{community.metadata.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {community.address && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Community Address</h3>
                  <p className="text-sm font-mono break-all">{community.address}</p>
                </div>
              )}

              {community.timestamp && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
                  <p className="text-sm">{new Date(community.timestamp).toLocaleDateString()}</p>
                </div>
              )}

              {community.owner && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Owner</h3>
                  <p className="text-sm font-mono break-all">{community.owner}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
