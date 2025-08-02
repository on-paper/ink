"use client";

import { BellIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "~/components/Link";
import { useNotifications } from "~/components/notifications/NotificationsContext";
import { Button } from "~/components/ui/button";

export const NotificationButton = () => {
  const { newCount, refresh } = useNotifications();
  const pathname = usePathname();

  const handleClick = () => {
    if (pathname === "/notifications") {
      refresh();
    }
  };

  return (
    <Link href="/activity" onClick={handleClick}>
      <Button variant="ghost" size="icon" className="w-12 h-12 relative">
        <BellIcon size={20} strokeWidth={2.5} />
        {newCount > 0 && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
            {newCount}
          </span>
        )}
      </Button>
    </Link>
  );
};
