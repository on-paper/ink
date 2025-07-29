import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { type SessionData, sessionOptions } from "~/lib/siwe-session";

export async function POST() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.destroy();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to logout:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
