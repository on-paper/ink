import { type NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { ecpCommentToPost } from "~/utils/ecp/converters/commentConverter";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";
const DEFAULT_CHAIN_ID = 8453; // Base

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");
  const address = searchParams.get("address");
  const channelId = searchParams.get("channelId") || searchParams.get("channel");
  const feed = searchParams.get("feed");
  const group = searchParams.get("group");
  const limit = Number.parseInt(searchParams.get("limit") || "50");
  const moderationStatus = searchParams.get("moderationStatus");

  const auth = await getServerAuth();
  const currentUserAddress = auth.address || "";

  try {
    console.log("Fetching posts with params:", {
      address,
      channelId,
      feed,
      group,
      limit,
      cursor,
      chainId: DEFAULT_CHAIN_ID,
      moderationStatus,
    });

    // Build query parameters
    const queryParams = new URLSearchParams({
      chainId: DEFAULT_CHAIN_ID.toString(),
      limit: limit.toString(),
      sort: "desc",
      mode: address ? "nested" : "flat", // Use nested mode for user profiles
    });

    if (cursor) queryParams.append("cursor", cursor);
    if (address) {
      queryParams.append("author", address);
    } else if (channelId || feed || group) {
      // For channel/group feeds, use the channel ID as targetUri
      const targetChannelId = channelId || feed || group;
      queryParams.append("channelId", targetChannelId);
    } else {
      // For main feed, query our app-specific targetUri
      queryParams.append("targetUri", "https://paper.ink");
    }

    if (moderationStatus) {
      queryParams.append("moderationStatus", moderationStatus);
    }

    const apiUrl = `${API_URLS.ECP}/api/comments?${queryParams}`;
    console.log("Fetching from:", apiUrl);

    const apiResponse = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
    });

    if (!apiResponse.ok) {
      throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`);
    }

    const response = await apiResponse.json();

    const ecpComments = response.results || [];

    // Convert ECP comments to Post format
    const posts = await Promise.all(
      ecpComments.map((comment: any) => ecpCommentToPost(comment, { currentUserAddress, includeReplies: true })),
    );

    // Use the cursor from the response for pagination
    const nextCursor = response.pagination?.hasNext ? response.pagination.endCursor : null;

    return NextResponse.json(
      {
        data: posts,
        nextCursor,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch posts: ", error);
    return NextResponse.json({ error: `Failed to fetch posts: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const postId = searchParams.get("id");

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  const auth = await getServerAuth();
  const currentUserAddress = auth.address;

  if (!currentUserAddress) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Note: Actual deletion happens on the blockchain via the delete hook
  // This endpoint just validates the request and returns success
  // The frontend will handle the actual blockchain transaction

  return NextResponse.json({ success: true, message: "Post deletion initiated" }, { status: 200 });
}
