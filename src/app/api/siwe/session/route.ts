import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { type SessionData, sessionOptions } from "~/lib/siwe-session";

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.siwe?.address) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const now = new Date();
    const expirationTime = new Date(session.siwe.expirationTime);

    if (now > expirationTime) {
      // Session expired, clear it
      session.destroy();
      return NextResponse.json({ isAuthenticated: false });
    }

    return NextResponse.json({
      isAuthenticated: true,
      address: session.siwe.address,
      chainId: session.siwe.chainId,
      domain: session.siwe.domain,
      expirationTime: session.siwe.expirationTime,
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json({ isAuthenticated: false });
  }
}
