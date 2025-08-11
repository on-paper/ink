import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isHexString(input: string): boolean {
  return /^0x[0-9a-fA-F]+$/.test(input);
}

export function formatChannelIdForUrl(channelId: string): string {
  if (!channelId) return "";
  if (isHexString(channelId)) return channelId;
  try {
    const big = BigInt(channelId);
    return `0x${big.toString(16)}`;
  } catch (_e) {
    return channelId;
  }
}
