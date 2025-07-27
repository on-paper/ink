import { lensGroupToGroup } from "@cartel-sh/ui";
import { fetchGroup } from "@lens-protocol/client/actions";
import { type NextRequest, NextResponse } from "next/server";
import { TRENDING_GROUP_ADDRESSES } from "~/constants/trendingGroups";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { client } = await getServerAuth();

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const page = cursor ? Number(cursor) : 1;
    const limit = 10;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedAddresses = TRENDING_GROUP_ADDRESSES.slice(startIndex, endIndex);

    const groupPromises = paginatedAddresses.map(async (address) => {
      const result = await fetchGroup(client, { group: address });
      if (result.isOk()) {
        const group = result.unwrapOr(null);
        if (group) {
          return lensGroupToGroup(group);
        }
      }
      return null;
    });

    const groups = await Promise.all(groupPromises);
    const validGroups = groups.filter((group) => group !== null);

    const hasMore = endIndex < TRENDING_GROUP_ADDRESSES.length;

    return NextResponse.json({
      data: validGroups,
      nextCursor: hasMore ? String(page + 1) : undefined,
    });
  } catch (error) {
    console.error("Error fetching trending groups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
