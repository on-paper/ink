import { NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { ensAccountToUser } from "~/utils/ens/converters/userConverter";

export const dynamic = "force-dynamic";

interface EthFollowAccount {
  address: string;
  ens?: {
    name: string;
    avatar?: string;
    records?: Record<string, string>;
  };
  efp_list_nft_token_id?: string;
  tags?: string[];
  is_following?: boolean;
  is_blocked?: boolean;
  is_muted?: boolean;
  updated_at?: string;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

  // Support both cursor (for Feed component) and offset parameters
  const cursor = req.nextUrl.searchParams.get("cursor");
  const offset = cursor ? Number.parseInt(cursor) : Number.parseInt(req.nextUrl.searchParams.get("offset") ?? "0");

  try {
    // Fetch followers from EthFollow API
    const response = await fetch(
      `${API_URLS.EFP}/users/${id}/followers?limit=${limit}&offset=${offset}`,
      { next: { revalidate: 300 } }, // Cache for 5 minutes
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch followers" }, { status: 500 });
    }

    const data = await response.json();
    const followers: EthFollowAccount[] = data.followers || [];

    // Convert followers to User format (ENS will be resolved client-side)
    const users = followers.map((follower) => {
      const account = {
        address: follower.address,
        ens: follower.ens,
      };
      return ensAccountToUser(account);
    });

    // Since EthFollow doesn't provide cursor-based pagination info,
    // we'll use offset-based pagination
    const hasMore = followers.length === limit;
    const nextOffset = hasMore ? offset + limit : null;

    return NextResponse.json(
      {
        data: users,
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
    return NextResponse.json({ error: `${error.message || "Unknown error"}` }, { status: 500 });
  }
}
