import { fetchPostsToExplore, fetchTimeline } from "@lens-protocol/client/actions";
import { PageSize, TimelineEventItemType } from "@lens-protocol/graphql";
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";
import { lensItemToPost } from "~/utils/lens/converters/postConverter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const { client, sessionClient, isAuthenticated, address } = await getServerAuth();

    let data;

    if (isAuthenticated && sessionClient) {
      data = await fetchTimeline(sessionClient, {
        account: address,
        filter: {
          eventType: [
            TimelineEventItemType.Post,
            TimelineEventItemType.Quote,
            TimelineEventItemType.Comment,
            TimelineEventItemType.Repost,
          ],
        },
        cursor,
      });
    } else {
      data = await fetchPostsToExplore(client, {
        pageSize: PageSize.Ten,
        cursor,
      });
    }

    if (data.isErr()) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const posts = data.value.items.map((item) => {
      return isAuthenticated ? lensItemToPost(item.primary) : lensItemToPost(item);
    });

    return NextResponse.json({ data: posts, nextCursor: data.value.pageInfo.next }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch feed: ", error);
    return NextResponse.json({ error: `Failed to fetch feed: ${error.message}` }, { status: 500 });
  }
}
