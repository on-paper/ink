import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { type SessionData, sessionOptions } from "~/lib/siwe-session";

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const nonce = generateNonce();
    session.nonce = nonce;
    await session.save();

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error("Failed to generate nonce:", error);
    return NextResponse.json({ error: "Failed to generate nonce" }, { status: 500 });
  }
}
