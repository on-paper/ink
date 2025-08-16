import type { Group } from "@cartel-sh/ui";
import { getBaseUrl } from "./getBaseUrl";

export async function getCommunityByAddress(address: string): Promise<Group | null> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/communities/${address}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch community");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching community:", error);
    return null;
  }
}
