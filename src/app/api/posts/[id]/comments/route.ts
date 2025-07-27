import { fetchPostReferences } from "@lens-protocol/client/actions";
import { PageSize, PostReferenceType } from "@lens-protocol/graphql";
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";
import { lensItemToPost } from "~/utils/lens/converters/postConverter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const author = req.nextUrl.searchParams.get("author") ?? undefined;

  if (!id) {
    return NextResponse.json({ error: "Missing publication id" }, { status: 400 });
  }

  try {
    const { client } = await getServerAuth();

    const result = await fetchPostReferences(client, {
      referenceTypes: [PostReferenceType.CommentOn],
      referencedPost: id,
      pageSize: PageSize.Ten,
      cursor,
      ...(author && { authors: [author] }),
    });

    if (result.isErr()) {
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }

    const comments = result.value;

    if (!comments.items) {
      throw new Error("No comments found");
    }

    const commentsPosts = comments.items.map((comment) => lensItemToPost(comment));

    return NextResponse.json(
      {
        comments: commentsPosts,
        nextCursor: comments.pageInfo.next,
        note: "Comment filtering is limited with the current API version",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to load comments: ", error.message);
    return NextResponse.json({ error: `${error.message}` }, { status: 500 });
  }
}
