import { API_URLS } from "~/config/api";

const DEFAULT_CHAIN_ID = 8453; // Base

export interface ECPChannel {
  id: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  name: string;
  description?: string;
  metadata?: any;
  hook?: string;
  chainId: number;
}

export interface ECPChannelsResponse {
  results: ECPChannel[];
  pagination: {
    hasNext: boolean;
    endCursor?: string;
  };
}

export async function fetchChannel(channelId: string): Promise<ECPChannel | null> {
  try {
    const response = await fetch(`${API_URLS.ECP}/api/channels/${channelId}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch channel: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching channel:", error);
    throw error;
  }
}

export async function fetchChannels(
  params: { cursor?: string; owner?: string; chainId?: number; limit?: number; sort?: "asc" | "desc" } = {},
): Promise<ECPChannelsResponse> {
  try {
    const queryParams = new URLSearchParams({
      chainId: (params.chainId || DEFAULT_CHAIN_ID).toString(),
      limit: (params.limit || 50).toString(),
      sort: params.sort || "desc",
    });

    if (params.cursor) queryParams.append("cursor", params.cursor);
    if (params.owner) queryParams.append("owner", params.owner);

    const response = await fetch(`${API_URLS.ECP}/api/channels?${queryParams}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching channels:", error);
    throw error;
  }
}
