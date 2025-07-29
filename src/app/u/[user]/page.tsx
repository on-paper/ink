import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";
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

  const ogImageURL = `${process.env.NEXT_PUBLIC_SITE_URL}og/user?handle=${username}&name=${encodeURIComponent(
    username,
  )}&profilePictureUrl=${user.profilePictureUrl}`;

  return {
    title,
    description,
    openGraph: {
      images: [ogImageURL],
      title,
      description,
      type: "profile",
      url: `https://paper.ink/u/${username}`,
      siteName: "Paper",
      locale: "en_US",
    },
  };
}

const UserPage = async ({ params }: { params: { user: string } }) => {
  const username = params.user;
  const user = await getUserByUsername(username);

  if (!user) return notFound();

  return <Feed ItemView={PostView} endpoint={`/api/posts?address=${user.address}&type=main`} />;
};

export default UserPage;
