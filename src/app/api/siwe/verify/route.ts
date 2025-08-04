import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { parseSiweMessage } from "viem/siwe";
import { type SessionData, sessionOptions } from "~/lib/siwe-session";
import { getPublicClient } from "~/lib/viem";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();

    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    const parsedMessage = parseSiweMessage(message);

    const expectedUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://paper.ink");
    const expectedDomain = expectedUrl.port ? `${expectedUrl.hostname}:${expectedUrl.port}` : expectedUrl.hostname;

    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http()
    });

    if (parsedMessage.nonce !== session.nonce) {
      console.error(`Invalid nonce: ${parsedMessage.nonce}. Expected: ${session.nonce}`);
      return NextResponse.json(
        { error: "Invalid nonce" },
        { status: 401 },
      );
    }

    if (parsedMessage.domain !== expectedDomain) {
      console.error(`Invalid domain: ${parsedMessage.domain}. Expected: ${expectedDomain}`);
      return NextResponse.json(
        { error: `Invalid domain: ${parsedMessage.domain}. Expected: ${expectedDomain}` },
        { status: 401 },
      );
    }

    const isValid = await publicClient.verifyMessage({
      address: parsedMessage.address,
      message,
      signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const now = new Date();
    const expirationTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Store complete session data as recommended by wagmi
    session.siwe = {
      address: parsedMessage.address,
      chainId: parsedMessage.chainId,
      domain: parsedMessage.domain,
      uri: parsedMessage.uri,
      issued: now.toISOString(),
      expirationTime: expirationTime.toISOString(),
      statement: parsedMessage.statement,
    };

    // Clear the nonce after successful verification
    session.nonce = undefined;
    await session.save();

    return NextResponse.json({
      ok: true,
      address: parsedMessage.address,
      chainId: parsedMessage.chainId,
      expirationTime: expirationTime.toISOString(),
    });
  } catch (error) {
    console.error("Failed to verify signature:", error);
    return NextResponse.json({ error: "Failed to verify signature" }, { status: 500 });
  }
}
