import { NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";

export const dynamic = "force-dynamic";

interface EfpFollowingResponse {
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
  const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "5", 10);

  const cursor = req.nextUrl.searchParams.get("cursor");
  const offset = cursor
    ? Number.parseInt(cursor, 10)
    : Number.parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);

  try {
    const response = await fetch(
      `${API_URLS.EFP}/users/${id}/following?limit=${limit}&offset=${offset}`,
      { next: { revalidate: 300 } }, // Cache for 5 minutes
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch following" }, { status: 500 });
    }

    const data = await response.json();
    const following: EfpFollowingResponse[] = data.following || [];

    const users = await Promise.all(
      following.map((account) => {
        const address = account.address || account.data || "";
        return fetchEnsUser(address, {
          skipStats: true,
          skipFollowRelationships: true,
        });
      }),
    );

    const validUsers = users.filter(Boolean);
    const hasMore = following.length === limit;
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
    console.error("Failed to fetch following: ", error);
    return NextResponse.json({ error: `${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 });
  }
}
