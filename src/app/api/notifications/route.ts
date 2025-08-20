import type { Notification } from "@cartel-sh/ui";
import { NextRequest, NextResponse } from "next/server";
import { API_URLS } from "~/config/api";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";
import { getServerAuth } from "~/utils/getServerAuth";

interface EFPNotification {
  address: string;
  name: string | null;
  avatar: string | null;
  token_id: number;
  action: string;
  opcode: number;
  op: string;
  tag: string;
  updated_at: string;
}

interface EFPNotificationResponse {
  summary: {
    interval: string;
    total: number;
    total_follows: number;
    total_unfollows: number;
    total_tags: number;
    total_untags: number;
  };
  notifications: EFPNotification[];
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use authenticated user's address
    const userAddress = auth.address;

    if (!userAddress) {
      return NextResponse.json({ error: "Address or ENS required" }, { status: 400 });
    }

    // Fetch notifications from EFP API
    const efpUrl = new URL(`${API_URLS.EFP}/users/${userAddress}/notifications`);

    // Add query parameters
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const limit = searchParams.get("limit") || "20";
    const interval = searchParams.get("interval") || "all";

    const offset = cursor ? Number.parseInt(cursor, 10) : 0;

    efpUrl.searchParams.append("interval", interval);
    efpUrl.searchParams.append("limit", String(Number.parseInt(limit, 10) + 1)); // Fetch one extra to check if there's more
    efpUrl.searchParams.append("offset", String(offset));

    const response = await fetch(efpUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`EFP API error: ${response.status}`);
    }

    const efpData: EFPNotificationResponse = await response.json();

    const notificationsWithUsers = await Promise.all(
      efpData.notifications.map(async (efpNotif) => {
        let notificationType: Notification["type"] = "Follow";

        switch (efpNotif.action) {
          case "follow":
            notificationType = "Follow";
            break;
          case "unfollow":
            return null;
          case "tag":
            notificationType = "Mention";
            break;
          default:
            notificationType = "Action";
        }

        const user = await fetchEnsUser(efpNotif.address, userAddress);

        if (!user) {
          return {
            id: `efp-${efpNotif.token_id}-${efpNotif.updated_at}`,
            type: notificationType,
            createdAt: new Date(efpNotif.updated_at),
            who: [
              {
                id: efpNotif.address,
                username: efpNotif.name || `${efpNotif.address.slice(0, 6)}...${efpNotif.address.slice(-4)}`,
                name: efpNotif.name,
                address: efpNotif.address,
                namespace: "ens",
                actions: {
                  muted: false,
                  blocked: false,
                  followed: false,
                  following: false,
                },
              },
            ],
            actedOn: undefined,
            actionType: efpNotif.tag || undefined,
          };
        }

        const notification: Notification = {
          id: `efp-${efpNotif.token_id}-${efpNotif.updated_at}`,
          type: notificationType,
          createdAt: new Date(efpNotif.updated_at),
          who: [user],
          actedOn: undefined, // EFP doesn't provide post/comment data
          actionType: efpNotif.tag || undefined,
        };

        return notification;
      }),
    );

    const notifications = notificationsWithUsers.filter(Boolean) as Notification[];

    const requestedLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const hasMore = notifications.length > requestedLimit;
    const paginatedNotifications = notifications.slice(0, requestedLimit);

    // Group notifications by type and user for better UX
    const groupedNotifications = groupNotifications(paginatedNotifications);

    const nextCursor = hasMore ? String(offset + requestedLimit) : undefined;

    return NextResponse.json({
      data: groupedNotifications,
      nextCursor,
      summary: efpData.summary,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// Helper function to group similar notifications
function groupNotifications(notifications: Notification[]): Notification[] {
  const grouped: Map<string, Notification> = new Map();

  for (const notif of notifications) {
    // Create a key based on type and time window (1 hour)
    const timeWindow = Math.floor(new Date(notif.createdAt).getTime() / (1000 * 60 * 60));
    const key = `${notif.type}-${timeWindow}`;

    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      // Add user to existing notification if not already present
      const userExists = existing.who.some((u) => u.id === notif.who[0].id);
      if (!userExists) {
        existing.who.push(...notif.who);
      }
    } else {
      grouped.set(key, { ...notif });
    }
  }

  // Sort by most recent first
  return Array.from(grouped.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
