import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostThread } from "~/components/post/PostThread";
import { getBaseUrl } from "~/utils/getBaseUrl";

/**
 * This route resolves to universal id of the post passed in the [slug]
 */
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

const post = async ({ params }: { params: { slug: string } }) => {
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

    const postData = await response.json();

    return <PostThread post={postData} />;
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
};

export default post;
