"use client";

import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FeedSuspense } from "~/components/FeedSuspense";
import Link from "~/components/Link";
import { SearchBar } from "~/components/menu/Search";
import { Button } from "~/components/ui/button";
import { usePostSearch } from "~/hooks/usePostSearch";
import { PostView } from "./post/PostView";

export function Search() {
  const params = useSearchParams();
  const query = params.get("q");

  const { data: posts, loading, error } = usePostSearch(query || undefined);

  if (error && query) throw new Error(error);
  if (loading) return <FeedSuspense />;

  const postViews = posts?.map((post) => <PostView key={post.id} item={post} />);

  return (
    <>
      <div className="h-16 flex flex-row gap-2 items-center justify-center sticky top-0 z-10 border-b backdrop-blur-md">
        <Link href={"/"}>
          <Button variant="ghost" size="sm" className="hover:bg-secondary/70">
            <ChevronLeft size={15} />
          </Button>
        </Link>
        <SearchBar defaultText={query} />
      </div>
      {query && postViews}
    </>
  );
}
