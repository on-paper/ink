import { type NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { SUPPORTED_CHAIN_IDS } from "~/lib/efp/config";
import { ecpCommentToPost } from "~/utils/ecp/converters/commentConverter";
import { postIdToEcpTarget } from "~/utils/ecp/targetConverter";
import { getServerAuth } from "~/utils/getServerAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const limit = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
  const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

  const auth = await getServerAuth();
  const currentUserAddress = auth.address || "";

  if (!id) {
    return NextResponse.json({ error: "Missing publication id" }, { status: 400 });
  }

  try {
    const targetUri = postIdToEcpTarget(id);

    const queryParams = new URLSearchParams({
      targetUri,
      chainId: SUPPORTED_CHAIN_IDS.join(","),
      limit: limit.toString(),
      sort: "desc",
      mode: "nested",
    });

    if (cursor) queryParams.append("cursor", cursor);

    const apiResponse = await fetch(`${API_URLS.ECP}/api/comments?${queryParams}`, {
      headers: { Accept: "application/json" },
    });

    if (!apiResponse.ok) {
      throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`);
    }

    const response = await apiResponse.json();
    const ecpComments = response.results || [];

    const comments = await Promise.all(
      ecpComments.map((comment: any) => ecpCommentToPost(comment, { currentUserAddress })),
    );

    const filteredComments = comments.filter((comment) => {
      const content = comment.metadata?.content;
      return content !== "[deleted]";
    });

    const nextCursor = response.pagination?.hasNext ? response.pagination.endCursor : null;

    return NextResponse.json(
      {
        comments: filteredComments,
        nextCursor,
        data: filteredComments,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to load comments from ECP: ", error);
    return NextResponse.json(
      { error: `Failed to fetch comments: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    );
  }
}
