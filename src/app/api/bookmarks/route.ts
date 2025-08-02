import { NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { SUPPORTED_CHAIN_IDS } from "~/lib/efp/config";
import { ecpCommentToPost } from "~/utils/ecp/converters/commentConverter";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuth();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarkedIds = req.headers.get("x-bookmarked-ids");

    if (!bookmarkedIds) {
      return NextResponse.json({ data: [] });
    }

    const postIds = bookmarkedIds.split(",").filter(Boolean);

    if (postIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const chainIdParam = SUPPORTED_CHAIN_IDS.join(",");

    const posts = await Promise.all(
      postIds.map(async (postId) => {
        try {
          const response = await fetch(`${API_URLS.ECP}/api/comments/${postId}?chainId=${chainIdParam}`, {
            headers: {
              Accept: "application/json",
            },
            next: { revalidate: 60 },
          });

          if (!response.ok) {
            console.error(`Failed to fetch post ${postId}:`, response.status);
            return null;
          }

          const comment = await response.json();
          const post = await ecpCommentToPost(comment, { currentUserAddress: auth.address || "" });
          return post;
        } catch (error) {
          console.error(`Error fetching post ${postId}:`, error);
          return null;
        }
      }),
    );

    const validPosts = posts.filter(Boolean);

    return NextResponse.json({
      data: validPosts,
      pagination: {
        hasMore: false,
        cursor: null,
      },
    });
  } catch (error) {
    console.error("Error fetching bookmarked posts:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarked posts" }, { status: 500 });
  }
}
