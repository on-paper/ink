import { fetchPostsToExplore } from "@lens-protocol/client/actions";
import { PageSize } from "@lens-protocol/graphql";
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";
import { lensItemToPost } from "~/utils/lens/converters/postConverter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const { client } = await getServerAuth();

    const data = await fetchPostsToExplore(client, {
      pageSize: PageSize.Ten,
      cursor,
    });

    if (data.isErr()) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const posts = data.value.items.map((item) => lensItemToPost(item));

    return NextResponse.json({ data: posts, nextCursor: data.value.pageInfo.next }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch explore posts: ", error);
    return NextResponse.json({ error: `Failed to fetch explore posts: ${error.message}` }, { status: 500 });
  }
}
