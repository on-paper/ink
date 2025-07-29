import { NextRequest, NextResponse } from "next/server";
import { fetchChannel } from "~/utils/ecp/channels";
import { ecpChannelToCommunity } from "~/utils/ecp/converters/channelConverter";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const channel = await fetchChannel(params.id);

    if (!channel) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const community = ecpChannelToCommunity(channel);

    return NextResponse.json(community);
  } catch (error) {
    console.error("Failed to fetch community:", error);
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}
