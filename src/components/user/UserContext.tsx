"use client";

import type { User } from "@cartel-sh/ui";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext } from "react";

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  requireAuth: (callback?: () => void) => boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const router = useRouter();

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (!user) {
        router.push("/login");
        return false;
      }
      callback?.();
      return true;
    },
    [user, router],
  );

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        requireAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
