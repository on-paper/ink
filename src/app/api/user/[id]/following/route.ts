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
  version?: number;
  record_type?: string;
  data?: string;
  tags?: string[];
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

  // Support both cursor (for Feed component) and offset parameters
  const cursor = req.nextUrl.searchParams.get("cursor");
  const offset = cursor ? Number.parseInt(cursor) : Number.parseInt(req.nextUrl.searchParams.get("offset") ?? "0");

  try {
    // Fetch following from EthFollow API
    const response = await fetch(
      `${API_URLS.EFP}/users/${id}/following?limit=${limit}&offset=${offset}`,
      { next: { revalidate: 300 } }, // Cache for 5 minutes
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 });
    }

    const data = await response.json();
    const following: EthFollowAccount[] = data.following || [];

    // Convert following to User format (ENS will be resolved client-side)
    const users = following.map((account) => {
      const followingAccount = {
        address: account.address || account.data || "",
        ens: account.ens,
      };
      return ensAccountToUser(followingAccount);
    });

    // Since EthFollow doesn't provide cursor-based pagination info,
    // we'll use offset-based pagination
    const hasMore = following.length === limit;
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
    console.error("Failed to fetch following: ", error);
    return NextResponse.json({ error: `${error.message || "Unknown error"}` }, { status: 500 });
  }
}
