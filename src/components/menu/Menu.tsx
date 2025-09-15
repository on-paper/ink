"use client";

import type { User } from "@cartel-sh/ui";
import { Bookmark, BookOpenIcon, Heart, LogInIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { AnimatedPaperLogo, type AnimatedPaperLogoHandle } from "~/components/icons/AnimatedPaperLogo";
import { LogoutIcon, type LogoutIconHandle } from "~/components/icons/LogoutIcon";
import { MoonIcon, type MoonIconHandle } from "~/components/icons/MoonIcon";
import PaperLogo from "~/components/icons/PaperLogo";
import { PlusIcon } from "~/components/icons/PlusIcon";
import { SettingsIcon, type SettingsIconHandle } from "~/components/icons/SettingsIcon";
import { SunIcon, type SunIconHandle } from "~/components/icons/SunIcon";
import { User2Icon, type User2IconHandle } from "~/components/icons/User2Icon";
import { UsersIcon, type UsersIconHandle } from "~/components/icons/UsersIcon";
import { Dock } from "~/components/ui/dock";
import { useAuth } from "~/hooks/useSiweAuth";
import { cn } from "~/utils";
import { useNotifications } from "../notifications/NotificationsContext";
import PostComposer, { type PostComposerHandle } from "../post/PostComposer";
import { Dialog, DialogContent } from "../ui/dialog";
import { UserAvatar } from "../user/UserAvatar";

interface MenuClientProps {
  isAuthenticated: boolean;
  user?: User | null;
}

export function Menu({ isAuthenticated, user }: MenuClientProps) {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { newCount } = useNotifications();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const composerRef = useRef<PostComposerHandle | null>(null);
  const usersIconRef = useRef<UsersIconHandle>(null);
  const user2IconRef = useRef<User2IconHandle>(null);
  const settingsIconRef = useRef<SettingsIconHandle>(null);
  const sunIconRef = useRef<SunIconHandle>(null);
  const moonIconRef = useRef<MoonIconHandle>(null);
  const logoutIconRef = useRef<LogoutIconHandle>(null);
  const paperLogoRef = useRef<AnimatedPaperLogoHandle>(null);

  useEffect(() => {
    router.prefetch("/home");
    router.prefetch("/communities");
    router.prefetch("/bookmarks");
    if (user?.username) {
      router.prefetch(`/u/${user.username}`);
    } else if (user?.address) {
      router.prefetch(`/u/${user.address}`);
    }
  }, [router, user]);

  const isHome = pathname === "/home";
  const isCommunities = pathname === "/communities";
  const isActivity = pathname === "/activity";
  const isBookmarks = pathname === "/bookmarks";
  const isSettings = pathname === "/settings";
  const isDocs = pathname === "/docs" || pathname.startsWith("/docs/");

  let homeInnerIcon: React.ReactNode;
  if (isHome) {
    homeInnerIcon = <PaperLogo className="w-5 h-5 md:w-6 md:h-6" stroke="currentColor" strokeWidth={2.25} />;
  } else if (isCommunities) {
    homeInnerIcon = <UsersIcon ref={usersIconRef} size={20} />;
  } else {
    homeInnerIcon = <PaperLogo className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.25} />;
  }

  const homeIcon = <div className="relative w-full h-full flex items-center justify-center">{homeInnerIcon}</div>;

  const activityIcon = (
    <div className="relative w-full h-full flex items-center justify-center">
      <Heart className={cn("w-5 h-5 md:w-6 md:h-6", isActivity && "fill-current")} strokeWidth={2.25} />
      {newCount > 0 && (
        <span className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] md:text-[10px] flex items-center justify-center font-medium">
          {newCount > 9 ? "9+" : newCount}
        </span>
      )}
    </div>
  );

  const bookmarkIcon = (
    <Bookmark className={cn("w-5 h-5 md:w-6 md:h-6", isBookmarks && "fill-current")} strokeWidth={2.25} />
  );

  const homeExtra = (
    <div className="flex flex-col w-48 p-1 gap-1">
      <button
        type="button"
        aria-current={isHome ? "page" : undefined}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left",
          isHome && "bg-accent/50 text-accent-foreground",
        )}
        onMouseEnter={() => paperLogoRef.current?.startAnimation()}
        onMouseLeave={() => paperLogoRef.current?.stopAnimation()}
        onClick={() => router.push("/home")}
      >
        <AnimatedPaperLogo ref={paperLogoRef} className="w-4 h-4" strokeWidth={2.5} size={14} />
        <span className="ml-3">Home</span>
      </button>
      <button
        type="button"
        aria-current={isCommunities ? "page" : undefined}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left",
          isCommunities && "bg-accent/50 text-accent-foreground",
        )}
        onMouseEnter={() => usersIconRef.current?.startAnimation()}
        onMouseLeave={() => usersIconRef.current?.stopAnimation()}
        onClick={() => router.push("/communities")}
      >
        <UsersIcon ref={usersIconRef} size={16} />
        <span className="ml-3">Communities</span>
      </button>
    </div>
  );

  const profileHandle = user?.username || user?.address;
  const profilePath = profileHandle ? `/u/${profileHandle}` : undefined;
  const isProfile = profilePath ? pathname === profilePath || pathname.startsWith(`${profilePath}/`) : false;
  const displayName =
    user?.username || (user?.address ? `${user.address.slice(0, 4)}...${user.address.slice(-4)}` : "User");
  const goProfile = () => {
    if (profilePath) router.push(profilePath);
  };

  const homeDockItem = {
    customIcon: homeIcon,
    label: "Home",
    onClick: () => router.push("/home"),
    isActive: isHome || isCommunities,
    extra: homeExtra,
  } as const;

  const activityDockItem = {
    customIcon: activityIcon,
    label: "Activity",
    onClick: () => router.push("/activity"),
    isActive: isActivity,
  } as const;

  const postDockItem = {
    customIcon: <PlusIcon size={20} />,
    label: "Post",
    onClick: () => setIsPostDialogOpen(true),
    variant: "secondary" as const,
  } as const;

  const profileDockItem = {
    customIcon: (
      <div
        className={cn(
          "w-7 h-7 p-0 shrink-0 rounded-full overflow-hidden",
          isProfile && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
        )}
      >
        {user && <UserAvatar link={false} card={false} user={user} />}
      </div>
    ),
    onClick: goProfile,
    label: "Profile",
    extra: (
      <div className="flex flex-col w-48 p-1 gap-1">
        <button
          type="button"
          aria-current={isProfile ? "page" : undefined}
          className={cn(
            "relative flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left",
            isProfile && "bg-accent/50 text-accent-foreground",
          )}
          onMouseEnter={() => user2IconRef.current?.startAnimation()}
          onMouseLeave={() => user2IconRef.current?.stopAnimation()}
          onClick={goProfile}
        >
          <User2Icon ref={user2IconRef} size={16} />
          <span className="ml-3">{displayName}</span>
        </button>
        <button
          type="button"
          aria-current={isSettings ? "page" : undefined}
          className={cn(
            "relative flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left",
            isSettings && "bg-accent/50 text-accent-foreground",
          )}
          onMouseEnter={() => settingsIconRef.current?.startAnimation()}
          onMouseLeave={() => settingsIconRef.current?.stopAnimation()}
          onClick={() => router.push("/settings")}
        >
          <SettingsIcon ref={settingsIconRef} size={16} />
          <span className="ml-3">Settings</span>
        </button>
        <button
          type="button"
          className="relative flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
          onMouseEnter={() => {
            if (theme === "light") {
              sunIconRef.current?.startAnimation();
            } else {
              moonIconRef.current?.startAnimation();
            }
          }}
          onMouseLeave={() => {
            if (theme === "light") {
              sunIconRef.current?.stopAnimation();
            } else {
              moonIconRef.current?.stopAnimation();
            }
          }}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <SunIcon ref={sunIconRef} size={16} /> : <MoonIcon ref={moonIconRef} size={16} />}
          <span className="ml-3">Theme</span>
        </button>
        <button
          type="button"
          aria-current={isDocs ? "page" : undefined}
          className={cn(
            "relative flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left",
            isDocs && "bg-accent/50 text-accent-foreground",
          )}
          onClick={() => router.push("/docs")}
        >
          <BookOpenIcon size={16} />
          <span className="ml-3">Docs</span>
        </button>
        <button
          type="button"
          className="relative flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-base outline-none transition-all duration-200 active:scale-[0.96] hover:bg-accent hover:text-accent-foreground w-full text-left"
          onMouseEnter={() => logoutIconRef.current?.startAnimation()}
          onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
          onClick={async () => {
            await signOut();
          }}
        >
          <LogoutIcon ref={logoutIconRef} size={16} />
          <span className="ml-3">Log out</span>
        </button>
      </div>
    ),
    isActive: isProfile,
  } as const;

  const bookmarksDockItem = {
    customIcon: bookmarkIcon,
    label: "Bookmarks",
    onClick: () => router.push("/bookmarks"),
    isActive: isBookmarks,
  } as const;

  const loginDockItem = {
    icon: LogInIcon,
    label: "Log in",
    onClick: () => router.push("/login"),
    isActive: pathname === "/login" || pathname === "/register",
  } as const;

  const dockItems = isAuthenticated
    ? [homeDockItem, activityDockItem, postDockItem, profileDockItem, bookmarksDockItem]
    : [homeDockItem, loginDockItem];

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full sm:bottom-auto sm:top-1/2 sm:right-2 sm:left-auto sm:w-auto sm:-translate-y-1/2 z-50">
        <div className="absolute inset-0 backdrop-blur-xl bg-background/90 pointer-events-none sm:hidden" />
        <div className="relative ">
          <Dock items={dockItems} />
        </div>
      </div>

      {isAuthenticated && (
        <Dialog
          open={isPostDialogOpen}
          onOpenChange={async (open) => {
            if (!open) {
              const canClose = await (composerRef.current?.confirmClose?.() || Promise.resolve(true));
              if (!canClose) return;
            }
            setIsPostDialogOpen(open);
          }}
          modal={true}
        >
          <DialogContent className="max-w-full sm:max-w-[700px]">
            <PostComposer
              ref={composerRef as any}
              user={user ?? undefined}
              onDirtyChange={() => {
                /* handled via ref */
              }}
              onSuccess={(newPost) => {
                setIsPostDialogOpen(false);
                if (newPost && !(newPost as any).isOptimistic) {
                  router.push(`/p/${newPost.id}`);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation dialog moved into PostComposer */}
    </>
  );
}
