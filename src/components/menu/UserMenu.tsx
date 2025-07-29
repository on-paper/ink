"use client";

import type { User } from "@cartel-sh/ui";
import { LogOutIcon, MoonIcon, SettingsIcon, SunIcon, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "~/components/Link";
import { useAuth } from "~/hooks/useSiweAuth";

export const formatAddress = (addr: string) => {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
};

export function UserMenuButtons({ user }: { user?: User | null }) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();

  const toggleTheme = () => {
    theme === "dark" ? setTheme("light") : setTheme("dark");
  };

  const handleLogout = async () => {
    await signOut();
  };

  const displayName = user?.username || (user?.address ? formatAddress(user.address) : "User");
  const profileLink = `/u/${user?.username || user?.address}`;

  return (
    <div className="flex flex-col w-48 p-1">
      <Link
        href={profileLink}
        className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground"
      >
        <UserIcon size={16} />
        <span className="ml-3">{displayName}</span>
      </Link>
      <Link
        href="/settings"
        className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground"
      >
        <SettingsIcon size={16} />
        <span className="ml-3">Settings</span>
      </Link>
      <button
        type="button"
        className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
        onClick={toggleTheme}
      >
        {theme === "light" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        <span className="ml-3">Theme</span>
      </button>
      <button
        type="button"
        className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
        onClick={handleLogout}
      >
        <LogOutIcon size={16} />
        <span className="ml-3">Log out</span>
      </button>
    </div>
  );
}
