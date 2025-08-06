"use client";
import { BookmarkIcon, HeartIcon, HistoryIcon, HomeIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export const RouteTitle = () => {
  const pathname = usePathname();
  const path = pathname.split("/").slice(1);
  const icon = getRouteIcon(pathname);

  return (
    <div className="relative w-full h-24 flex flex-col items-center justify-center rounded-lg overflow-visible">
      <h1 className="text-3xl font-bold py-2 flex flex-row gap-2 items-center relative z-20">
        {icon} {path}
      </h1>
    </div>
  );
};

const getRouteIcon = (route: string) => {
  switch (route) {
    case "/bookmarks":
      return <BookmarkIcon strokeWidth={4} className="-mb-1" />;
    case "/settings":
      return <SettingsIcon strokeWidth={3} className="-mb-1" />;
    case "/activity":
      return <HeartIcon strokeWidth={4} className="-mb-1" />;
    case "/communities":
      return <UsersIcon strokeWidth={4} className="-mb-1" />;
    case "/changelog":
      return <HistoryIcon strokeWidth={4} className="-mb-1" />;
    default:
      return <HomeIcon strokeWidth={4} className="-mb-1" />;
  }
};
