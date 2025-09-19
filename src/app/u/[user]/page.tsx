import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";
import { generateUserOGUrl } from "~/utils/generateOGUrl";
import { getUserByUsername } from "~/utils/getUserByHandle";

export async function generateMetadata({ params }: { params: { user: string } }): Promise<Metadata> {
  const username = params.user;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: username,
      description: `${username} on Paper`,
    };
  }

  const title = `${username}`;
  const description = user.description || `${username} on Paper`;

  const ogImageURL = generateUserOGUrl({
    username: username,
    profilePictureUrl: user.profilePictureUrl,
  });

  return {
    title,
    description,
    openGraph: {
      images: [ogImageURL],
      title,
      description,
      type: "profile",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/u/${username}`,
      siteName: "Paper",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageURL],
    },
  };
}

const UserPage = async ({ params }: { params: { user: string } }) => {
  const username = params.user;
  const user = await getUserByUsername(username);

  if (!user) return notFound();

  return (
    <Feed
      ItemView={PostView}
      endpoint={`/api/posts?address=${user.address}&type=main`}
      emptyStateTitle="No posts from this user yet"
      emptyStateDescription="Check back soon to see what they share."
    />
  );
};

export default UserPage;
