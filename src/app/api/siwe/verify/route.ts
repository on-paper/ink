import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { type SessionData, sessionOptions } from "~/lib/siwe-session";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    const siweMessage = new SiweMessage(message);

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    // Verify the signature with the stored nonce
    const result = await siweMessage.verify({
      signature,
      nonce: session.nonce,
      domain: new URL(req.url).host,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Additional security checks
    if (siweMessage.domain !== new URL(req.url).host) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 401 });
    }

    const now = new Date();
    const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Store complete session data as recommended by wagmi
    session.siwe = {
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      domain: siweMessage.domain,
      uri: siweMessage.uri,
      issued: now.toISOString(),
      expirationTime: expirationTime.toISOString(),
      statement: siweMessage.statement,
    };

    // Clear the nonce after successful verification
    session.nonce = undefined;
    await session.save();

    return NextResponse.json({
      ok: true,
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      expirationTime: expirationTime.toISOString(),
    });
  } catch (error) {
    console.error("Failed to verify signature:", error);
    return NextResponse.json({ error: "Failed to verify signature" }, { status: 500 });
  }
}
