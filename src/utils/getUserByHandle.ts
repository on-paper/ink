import type { User } from "@cartel-sh/ui";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";
import { getServerAuth } from "./getServerAuth";

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const { address: currentUserAddress } = await getServerAuth();

  const user = await fetchEnsUser(username, currentUserAddress);
  return user;
};
