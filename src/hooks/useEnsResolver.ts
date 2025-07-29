"use client";

import type { User } from "@cartel-sh/ui";
import { useQuery } from "@tanstack/react-query";

interface EnsData {
  name: string;
  avatar?: string;
  records?: Record<string, string>;
}

async function fetchEnsData(address: string): Promise<EnsData | null> {
  try {
    const response = await fetch(`/api/user/ens/${address}`);
    if (!response.ok) return null;

    const user: User = await response.json();

    if (user.username !== user.address && !user.username.includes("...")) {
      return {
        name: user.username,
        avatar: user.profilePictureUrl,
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch ENS for ${address}:`, error);
    return null;
  }
}

export function useEnsResolver(address: string | undefined) {
  return useQuery({
    queryKey: ["ens", address],
    queryFn: () => fetchEnsData(address!),
    enabled: !!address && address.startsWith("0x"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook to resolve ENS for a user object
export function useResolvedUser(user: User) {
  const { data: ensData } = useEnsResolver(user.address);

  if (!ensData) return user;

  // Return user with resolved ENS data
  return {
    ...user,
    username: ensData.name,
    profilePictureUrl: ensData.avatar || user.profilePictureUrl,
  };
}
