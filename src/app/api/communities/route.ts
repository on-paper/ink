import { NextRequest, NextResponse } from "next/server";
import { fetchChannels } from "~/utils/ecp/channels";
import { ecpChannelToCommunity } from "~/utils/ecp/converters/channelConverter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Number.parseInt(searchParams.get("limit") || "50");

  try {
    const response = await fetchChannels({
      cursor: cursor || undefined,
      limit,
      sort: "desc",
    });

    const communities = response.results.map(ecpChannelToCommunity);

    return NextResponse.json({
      data: communities,
      nextCursor: response.pagination.hasNext ? response.pagination.endCursor : null,
    });
  } catch (error) {
    console.error("Failed to fetch communities:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}
