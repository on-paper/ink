import { lensGroupToGroup } from "@cartel-sh/ui";
import type { Group as LensGroup } from "@lens-protocol/client";
import { GroupsOrderBy, PageSize, type Paginated, type UnexpectedError } from "@lens-protocol/client";
import { fetchGroups } from "@lens-protocol/client/actions";
import type { Result } from "neverthrow";
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchQuery = searchParams.get("q") || "";
  const limit = Number.parseInt(searchParams.get("limit") || "20");
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const { client } = await getServerAuth();

    let result: Result<Paginated<LensGroup>, UnexpectedError>;
    try {
      result = await fetchGroups(client, {
        filter: {
          ...(searchQuery && { searchQuery }),
        },
        orderBy: GroupsOrderBy.LatestFirst,
        pageSize: PageSize.Ten,
        cursor,
      });
    } catch (fetchError) {
      return NextResponse.json(
        {
          error: "Failed to fetch groups",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        },
        { status: 500 },
      );
    }

    if (result.isErr()) {
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }

    const data = result.unwrapOr(null);
    if (!data) {
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }

    return NextResponse.json({
      data: data.items.map((group) => lensGroupToGroup(group)),
      nextCursor: data.pageInfo.next || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
