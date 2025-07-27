"use client";

import type { User } from "@cartel-sh/ui";
import { LogOutIcon, MoonIcon, SettingsIcon, SunIcon, UserIcon, UsersRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAccount, useDisconnect } from "wagmi";
import Link from "~/components/Link";
import { clearCookies } from "~/utils/clearCookies";

export function UserMenuButtons({ handle }: { handle: string; user: User }) {
  const { isConnected } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    theme === "dark" ? setTheme("light") : setTheme("dark");
  };

  const logout = async () => {
    if (isConnected) {
      disconnectWallet();
    }
    await clearCookies();
    router.push("/home");
    router.refresh();
  };

  const switchProfile = () => {
    router.push("/login");
  };

  return (
    <div className="flex flex-col w-48 p-1">
      <Link
        href={`/u/${handle}`}
        className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground"
      >
        <UserIcon size={16} />
        <span className="ml-3">Profile</span>
      </Link>
      <button
        type="button"
        className="relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
        onClick={switchProfile}
      >
        <UsersRoundIcon size={16} />
        <span className="ml-3">Switch Profile</span>
      </button>
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
        onClick={logout}
      >
        <LogOutIcon size={16} />
        <span className="ml-3">Log out</span>
      </button>
    </div>
  );
}
