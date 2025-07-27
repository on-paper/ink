import { lensGroupToGroup } from "@cartel-sh/ui";
import { fetchGroup } from "@lens-protocol/client/actions";
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { client } = await getServerAuth();

    const result = await fetchGroup(client, {
      group: params.id,
    });

    if (result.isErr()) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const group = result.unwrapOr(null);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(lensGroupToGroup(group));
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
