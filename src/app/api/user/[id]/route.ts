import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    return NextResponse.json({ profile: {}, lensProfile: {} }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch profile: ", error);
    return NextResponse.json({ error: `Failed to fetch profile: ${error.message}` }, { status: 500 });
  }
}
