import type { AnyPost } from "@lens-protocol/client";
import { usePosts as useLensPosts } from "@lens-protocol/react";
import { lensItemToPost } from "~/utils/lens/converters/postConverter";

export function usePostSearch(query?: string) {
  const result = useLensPosts({
    filter: {
      ...(query && { searchQuery: query }),
    },
  });

  return {
    ...result,
    data: result.data?.items?.map((post: AnyPost) => lensItemToPost(post)),
  };
}
