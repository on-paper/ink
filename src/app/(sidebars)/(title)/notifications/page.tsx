import { fetchNotifications } from "@lens-protocol/client/actions";
import { lensNotificationToNative } from "~/components/notifications/Notification";
import { NotificationsPageClient } from "~/components/notifications/NotificationsPageClient";
import { getServerAuth } from "~/utils/getServerAuth";

const endpoint = "/api/notifications";

const notifications = async () => {
  const { notifications, nextCursor } = await getInitialFeed();

  if (!notifications) {
    throw new Error("Failed to get notifications (T T)");
  }

  return <NotificationsPageClient endpoint={endpoint} initialData={notifications} initialCursor={nextCursor} />;
};

const getInitialFeed = async () => {
  const { client, isAuthenticated } = await getServerAuth();

  if (!isAuthenticated) {
    // throw new Error("Unauthorized TT");
    return {
      notifications: [],
      nextCursor: undefined,
    };
  }

  try {
    if (client.isSessionClient()) {
      const result = await fetchNotifications(client, {
        cursor: undefined,
        filter: {
          timeBasedAggregation: true,
          includeLowScore: false,
        },
      });

      if (result.isErr()) {
        throw new Error(result.error.message);
      }

      const notifications = result.value.items.map(lensNotificationToNative);

      return {
        notifications,
        nextCursor: result.value.pageInfo.next,
      };
    }
    throw new Error("Session client required for notifications");
  } catch (error) {
    console.error("Error using fetchNotifications action:", error);

    // We no longer need the fallback since the client.notifications.fetch() method
    // is deprecated in the new API. Instead, we'll throw an error.
    throw new Error(`Failed to fetch notifications: ${error.message || "Unknown error"}`);
  }
};

export default notifications;
