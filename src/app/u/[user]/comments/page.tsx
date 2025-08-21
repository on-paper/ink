import type { Metadata } from "next";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";
import { getUserByUsername } from "~/utils/getUserByHandle";

export async function generateMetadata({ params }: { params: { user: string } }): Promise<Metadata> {
  const handle = params.user;
  const title = `${handle}`;
  return {
    title,
    description: `@${handle}'s comments on Paper`,
    openGraph: {
      title,
      description: `@${handle}'s comments on Paper`,
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

const user = async ({ params }: { params: { user: string } }) => {
  const handle = params.user;
  const user = await getUserByUsername(handle);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <Feed
      ItemView={PostView}
      endpoint={`/api/posts?address=${user.address}&type=comment`}
      emptyStateDescription="No comments."
    />
  );
};

export default user;
