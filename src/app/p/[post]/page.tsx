import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostView } from "~/components/post/PostView";
import { getBaseUrl } from "~/utils/getBaseUrl";

export async function generateMetadata({ params }: { params: { post: string } }): Promise<Metadata> {
  const title = "Post";
  const description = "View post on Paper";

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

export default async function PostPage({ params }: { params: { post: string } }) {
  try {
    const response = await fetch(`${getBaseUrl()}/api/posts/${params.post}`, {
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
      <div className="max-w-3xl p-4 mx-auto">
        <PostView item={post} defaultExpanded={true} defaultReplyOpen={false} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}
