"use client";

import type { Group } from "@cartel-sh/ui";
import { useSearchParams } from "next/navigation";
import { Feed } from "~/components/Feed";
import { GroupView } from "~/components/groups/GroupView";
import { TrendingGroups } from "~/components/groups/TrendingGroups";
import { SearchBar } from "~/components/menu/Search";
import { TRENDING_GROUP_ADDRESSES } from "~/constants/trendingGroups";

interface GroupsProps {
  initialQuery?: string;
}

const GroupViewWrapper = ({ item }: { item: Group }) => {
  return <GroupView group={item} />;
};

export default function Groups({ initialQuery = "" }: GroupsProps) {
  const searchParams = useSearchParams();
  const query = initialQuery || searchParams.get("q") || "";

  return (
    <>
      <div className="mb-6">
        <SearchBar defaultText={query} />
      </div>

      {!query && <TrendingGroups groupAddresses={TRENDING_GROUP_ADDRESSES} />}

      <Feed<Group>
        ItemView={GroupViewWrapper}
        endpoint={`/api/groups${query ? `?q=${encodeURIComponent(query)}` : ""}`}
        queryKey={["groups", query]}
      />
    </>
  );
}
