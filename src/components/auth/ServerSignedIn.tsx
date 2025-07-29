import type { ReactNode } from "react";
import { getServerAuth } from "~/utils/getServerAuth";

export async function ServerSignedIn({ children }: { children: ReactNode }) {
  const { isAuthenticated } = await getServerAuth();
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export async function ServerSignedOut({ children }: { children: ReactNode }) {
  const { isAuthenticated } = await getServerAuth();
  if (isAuthenticated) return null;

  return <>{children}</>;
}
