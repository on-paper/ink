import type { Metadata } from "next";
import { GalleryFeed } from "~/components/GalleryFeed";
import { GalleryPostView } from "~/components/post/GalleryPostView";
import { getUserByUsername } from "~/utils/getUserByHandle";

export async function generateMetadata({ params }: { params: { user: string } }): Promise<Metadata> {
  const handle = params.user;
  const title = `${handle}`;
  return {
    title,
    description: `@${handle}'s gallery on Pingpad`,
    openGraph: {
      title,
      description: `@${handle}'s gallery on Pingpad`,
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

const userGallery = async ({ params }: { params: { user: string } }) => {
  const handle = params.user;
  const user = await getUserByUsername(handle);

  if (!user || !user.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-semibold mb-2">User not found</h2>
        <p className="text-muted-foreground">The user @{handle} could not be found.</p>
      </div>
    );
  }

  return (
    <GalleryFeed ItemView={GalleryPostView} endpoint={`/api/posts?address=${user.address}&type=post&media=true`} />
  );
};

export default userGallery;
