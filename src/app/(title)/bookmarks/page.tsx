"use client";

import { useAtomValue } from "jotai";
import { bookmarksAtom } from "~/atoms/bookmarks";
import { PostView } from "~/components/post/PostView";
import { useBookmarkedPosts } from "~/hooks/useBookmarkedPosts";

// Move metadata to a layout or generate it server-side
// export const metadata: Metadata = {
//   title: "Bookmarks",
//   description: "Your bookmarked posts",
//   openGraph: {
//     title: "Bookmarks",
//     description: "Your bookmarked posts",
//     images: [
//       {
//         url: "/logo.png",
//         width: 1200,
//         height: 630,
//       },
//     ],
//   },
// };

const BookmarksPage = () => {
  const bookmarkedIds = useAtomValue(bookmarksAtom);
  const { data: posts = [], error } = useBookmarkedPosts();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Failed to load bookmarks</p>
        <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
      </div>
    );
  }

  // If we have bookmarked IDs but no posts loaded yet, it might still be loading
  if (bookmarkedIds.length > 0 && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Loading bookmarks...</p>
        <p className="text-sm text-muted-foreground mt-2">Found {bookmarkedIds.length} bookmarked posts</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">No bookmarks yet</p>
        <p className="text-sm text-muted-foreground mt-2">Save posts to view them here later</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostView key={post.id} item={post} />
      ))}
    </div>
  );
};

export default BookmarksPage;
