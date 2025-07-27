"use client";

import type { Notification } from "@cartel-sh/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useUser } from "../user/UserContext";

interface NotificationsContextValue {
  notifications: Notification[];
  lastSeen: number;
  newCount: number;
  setNotifications: (items: Notification[]) => void;
  markAllAsRead: () => void;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

function parseNotification(raw: any): Notification {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    actedOn: raw.actedOn
      ? {
          ...raw.actedOn,
          createdAt: new Date(raw.actedOn.createdAt),
          updatedAt: raw.actedOn.updatedAt ? new Date(raw.actedOn.updatedAt) : undefined,
        }
      : undefined,
  } as Notification;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await fetch("/api/notifications");
  if (res.status === 401) {
    console.log("Not authenticated - skipping notification refresh");
    return [];
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.statusText}`);
  }
  const data = await res.json();
  if (Array.isArray(data.data)) {
    return data.data.map(parseNotification);
  }
  return [];
};

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [lastSeen, setLastSeen] = useState<number>(() => {
    if (typeof window === "undefined") return Date.now();
    const stored = window.localStorage.getItem("lastSeenNotifications");
    return stored ? Number.parseInt(stored, 10) : Date.now();
  });
  const [baseTitle, setBaseTitle] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Use TanStack Query for fetching and caching notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: !!user,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 60 * 1000, // Poll every 60 seconds
    refetchIntervalInBackground: true, // Continue polling in background
  });

  // Sort notifications by date
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const computeNewCount = (items: Notification[]) => {
    const newNotifications = items.filter((n) => {
      const notificationTime = new Date(n.createdAt).getTime();
      const isNew = notificationTime > lastSeen;

      if (isNew) {
        console.log("New notification:", {
          id: n.id,
          type: n.type,
          createdAt: n.createdAt,
          notificationTime,
          lastSeen,
          isNew,
          who: n.who.map((u) => ({ name: u.name, handle: u.username })),
        });
      }

      return isNew;
    });

    return newNotifications.length;
  };

  const newCount = computeNewCount(sortedNotifications);

  const setNotifications = (items: Notification[]) => {
    // Update the query cache directly
    queryClient.setQueryData(["notifications"], items);
  };

  const refresh = useCallback(async () => {
    console.log("Manually refreshing notifications...");
    await refetch();
  }, [refetch]);

  useEffect(() => {
    setBaseTitle(document.title);
  }, [pathname]);

  useEffect(() => {
    if (!baseTitle) return;
    if (newCount > 0) {
      document.title = `(${newCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [newCount, baseTitle]);

  const markAllAsRead = useCallback(() => {
    const now = Date.now();
    setLastSeen(now);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lastSeenNotifications", now.toString());
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications: sortedNotifications,
        lastSeen,
        newCount,
        setNotifications,
        markAllAsRead,
        refresh,
        isLoading,
        error,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
