import type { Metadata } from "next";
import { BookmarksFeed } from "~/components/BookmarksFeed";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your bookmarked posts",
  openGraph: {
    title: "Bookmarks",
    description: "Your bookmarked posts",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const BookmarksPage = async () => {
  return <BookmarksFeed />;
};

export default BookmarksPage;
