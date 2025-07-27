import type { User } from "@cartel-sh/ui";
import { AnyClient, SessionClient } from "@lens-protocol/client";
import { fetchMeDetails } from "@lens-protocol/client/actions";
import { lensAccountToUser } from "~/utils/lens/converters/userConverter";
import { getCookieAuth } from "./getCookieAuth";
import { getLensClient } from "./lens/getLensClient";

interface ServerAuthResult {
  isAuthenticated: boolean;
  address: string | null;
  handle: string | null;
  client: AnyClient;
  sessionClient: SessionClient | null;
  user: User | null;
}

export const getServerAuth = async (): Promise<ServerAuthResult> => {
  const client = await getLensClient();

  const unauthenticatedResult: ServerAuthResult = {
    isAuthenticated: false,
    address: null,
    handle: null,
    client,
    sessionClient: null,
    user: null,
  };

  const { isValid } = getCookieAuth();
  if (!isValid) {
    return unauthenticatedResult;
  }

  try {
    if (!client.isSessionClient()) {
      return unauthenticatedResult;
    }

    const sessionClient = client as SessionClient;
    const authenticatedUser = sessionClient.getAuthenticatedUser();

    if (authenticatedUser.isErr() || !authenticatedUser.value) {
      return unauthenticatedResult;
    }

    const account = await fetchMeDetails(sessionClient);

    if (account.isErr()) {
      return unauthenticatedResult;
    }

    const address = authenticatedUser.value.address;
    const handle = account.value.loggedInAs.account.username?.localName || null;
    const user = lensAccountToUser(account.value.loggedInAs.account);

    return {
      isAuthenticated: true,
      address,
      handle,
      client,
      sessionClient,
      user,
    };
  } catch (error) {
    console.error("Server auth error:", error);
    return unauthenticatedResult;
  }
};
