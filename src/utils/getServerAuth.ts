import type { User } from "@cartel-sh/ui";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { type SessionData, sessionOptions } from "~/lib/siwe-session";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";

export interface ServerAuthResult {
  isAuthenticated: boolean;
  address?: string;
  chainId?: number;
  user: User | null;
}

export async function getServerAuth(): Promise<ServerAuthResult> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.siwe?.address) {
      return { isAuthenticated: false, user: null };
    }

    // Check if session has expired
    const now = new Date();
    const expirationTime = new Date(session.siwe.expirationTime);

    if (now > expirationTime) {
      session.destroy();
      return { isAuthenticated: false, user: null };
    }

    const user = await fetchEnsUser(session.siwe.address, { currentUserAddress: session.siwe.address });

    return {
      isAuthenticated: true,
      address: session.siwe.address,
      chainId: session.siwe.chainId,
      user,
    };
  } catch (error) {
    console.error("Server auth error:", error);
    return { isAuthenticated: false, user: null };
  }
}
