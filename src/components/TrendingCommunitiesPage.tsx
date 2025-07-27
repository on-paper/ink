"use client";

import type { Group } from "@cartel-sh/ui";
import { ArrowLeft } from "lucide-react";
import { Feed } from "~/components/Feed";
import { GroupView } from "~/components/groups/GroupView";
import Link from "~/components/Link";

const GroupViewWrapper = ({ item }: { item: Group }) => {
  return <GroupView group={item} />;
};

export default function TrendingCommunitiesPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold">Trending Communities</h1>
      </div>

      <Feed<Group> ItemView={GroupViewWrapper} endpoint="/api/groups/trending" queryKey={["trending-groups"]} />
    </div>
  );
}
