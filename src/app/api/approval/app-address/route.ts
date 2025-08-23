import { type NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const appPrivateKey = process.env.APP_SIGNER_PRIVATE_KEY;
    if (!appPrivateKey) {
      return NextResponse.json({ error: "App signer not configured" }, { status: 500 });
    }

    const formattedPrivateKey = appPrivateKey.startsWith("0x") ? appPrivateKey : `0x${appPrivateKey}`;
    const app = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    return NextResponse.json({ address: app.address });
  } catch (error) {
    console.error("[APP-ADDRESS] Error:", error);
    return NextResponse.json({ error: "Failed to get app address" }, { status: 500 });
  }
}
