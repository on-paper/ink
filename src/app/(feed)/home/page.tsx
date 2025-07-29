import type { Metadata } from "next";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";

export const metadata: Metadata = {
  title: "Home",
  description: "Paper feed",
  openGraph: {
    title: "Home",
    description: "Paper feed",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const endpoint = "api/posts/feed?moderationStatus=approved,pending";

const home = async () => {
  return <Feed ItemView={PostView} endpoint={endpoint} refetchInterval={300000} />;
};

export default home;
