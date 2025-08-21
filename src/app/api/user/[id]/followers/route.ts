import { NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";

export const dynamic = "force-dynamic";

interface EfpFollowersResponse {
  address: string;
  efp_list_nft_token_id?: string;
  tags?: string[];
  is_following?: boolean;
  is_blocked?: boolean;
  is_muted?: boolean;
  updated_at?: string;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "5", 10);

  const cursor = req.nextUrl.searchParams.get("cursor");
  const offset = cursor
    ? Number.parseInt(cursor, 10)
    : Number.parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);

  try {
    const response = await fetch(
      `${API_URLS.EFP}/users/${id}/followers?limit=${limit}&offset=${offset}`,
      { next: { revalidate: 300 } }, // Cache for 5 minutes
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
    }

    const data = await response.json();
    const followers: EfpFollowersResponse[] = data.followers || [];
    const users = await Promise.all(
      followers.map((follower) =>
        fetchEnsUser(follower.address, {
          skipStats: true,
          skipFollowRelationships: true,
        }),
      ),
    );

    const validUsers = users.filter(Boolean);
    const hasMore = followers.length === limit;
    const nextOffset = hasMore ? offset + limit : null;

    return NextResponse.json(
      {
        data: validUsers,
        nextCursor: nextOffset?.toString() || null,
        pagination: {
          limit,
          offset,
          hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch followers: ", error);
    return NextResponse.json({ error: `${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 });
  }
}
