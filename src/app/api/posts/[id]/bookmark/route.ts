import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getServerAuth();
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = params.id;

    // this endpoint just returns success to maintain the existing interface
    // The actual bookmark state is managed client-side

    return NextResponse.json({
      success: true,
      postId,
      message: "Bookmark state updated client-side",
    });
  } catch (error) {
    console.error("Error in bookmark endpoint:", error);
    return NextResponse.json({ error: "Failed to update bookmark" }, { status: 500 });
  }
}
