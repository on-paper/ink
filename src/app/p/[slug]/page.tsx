import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostView } from "~/components/post/PostView";
import { getBaseUrl } from "~/utils/getBaseUrl";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = "Post";
  const description = "View post on Pingpad";

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/posts/${params.slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error("Failed to fetch post");
    }

    const post = await response.json();

    return (
      <div className="flex flex-col gap-1 p-4">
        <div className="flex flex-col gap-1 min-h-screen">
          <div className="relative">
            <PostView item={post} defaultExpanded={true} defaultReplyOpen={false} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}