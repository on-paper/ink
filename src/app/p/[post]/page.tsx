import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostComments } from "~/components/post/PostComments";
import { PostView } from "~/components/post/PostView";
import { generatePostOGUrl } from "~/utils/generateOGUrl";
import { getBaseUrl } from "~/utils/getBaseUrl";

export async function generateMetadata({ params }: { params: { post: string } }): Promise<Metadata> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/posts/${params.post}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        title: "Post",
        description: "View post on Paper",
        openGraph: {
          type: "article",
          title: "Post",
          description: "View post on Paper",
        },
      };
    }

    const post = await response.json();

    const handle =
      post.author?.username ||
      `${post.author?.address?.slice(0, 6)}...${post.author?.address?.slice(-4)}` ||
      "Anonymous";
    const content = post.metadata?.content || "";
    const profilePictureUrl = post.author?.profilePictureUrl || "";
    const postImage = post.metadata?.__typename === "ImageMetadata" ? post.metadata?.image?.item : "";

    const title = `${handle} on Paper`;
    const description = content.length > 160 ? `${content.slice(0, 160)}...` : content || "View post on Paper";

    const ogImageURL = generatePostOGUrl({
      handle,
      content,
      profilePictureUrl,
      image: postImage || undefined,
    });

    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        images: [ogImageURL],
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/p/${params.post}`,
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
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Post",
      description: "View post on Paper",
      openGraph: {
        type: "article",
        title: "Post",
        description: "View post on Paper",
      },
    };
  }
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
        <PostComments post={post} level={1} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}
