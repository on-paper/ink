"use client";

import type { Group } from "@cartel-sh/ui";
import PostComposer from "~/components/post/PostComposer";
import { Card } from "~/components/ui/card";
import { useUser } from "~/components/user/UserContext";

interface CommunityPostComposerProps {
  community: Group;
  communityAddress: string;
}

export function CommunityPostComposer({ community, communityAddress }: CommunityPostComposerProps) {
  const { user } = useUser();

  if (!user) return null;

  if (!community.canPost || community.isBanned) return null;

  return (
    <Card className="p-4">
      <PostComposer user={user} community={communityAddress} />
    </Card>
  );
}
