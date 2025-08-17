import { type NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { SUPPORTED_CHAIN_IDS } from "~/lib/efp/config";
import { ecpCommentToPost } from "~/utils/ecp/converters/commentConverter";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const auth = await getServerAuth();
  const currentUserAddress = auth.address || "";
  const chainIdParam = SUPPORTED_CHAIN_IDS.join(",");

  try {
    const apiResponse = await fetch(`${API_URLS.ECP}/api/comments/${id}?chainId=${chainIdParam}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!apiResponse.ok) {
      if (apiResponse.status === 404) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`);
    }

    const comment = await apiResponse.json();
    const post = await ecpCommentToPost(comment, { currentUserAddress, includeReplies: true });

    if (post.metadata?.content === "[deleted]") {
      return NextResponse.json({ error: "Post has been deleted" }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch post: ", error);
    return NextResponse.json({ error: `Failed to fetch post: ${error.message}` }, { status: 500 });
  }
}
