"use client";

import { useEffect } from "react";
import { Feed } from "../Feed";
import { useNotifications } from "./NotificationsContext";
import { NotificationView } from "./NotificationView";

export function NotificationsFeed() {
  const { refresh, markAllAsRead } = useNotifications();

  useEffect(() => {
    refresh();

    const timer = setTimeout(() => {
      markAllAsRead();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Feed
      ItemView={NotificationView}
      endpoint="/api/notifications"
      queryKey={["notifications"]}
      emptyStateTitle="You're all caught up"
      emptyStateDescription="We'll let you know when new notifications arrive."
    />
  );
}
