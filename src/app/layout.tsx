import type { Metadata } from "next";
import { DeletedPostsProvider } from "~/components/DeletedPostsContext";
import { FilteredUsersProvider } from "~/components/FilteredUsersContext";
import { FloatingAudioPlayer } from "~/components/FloatingAudioPlayer";
import { NotificationsProvider } from "~/components/notifications/NotificationsContext";
import { Providers } from "~/components/Providers";
import { UserProvider } from "~/components/user/UserContext";
import { quicksand } from "~/styles/fonts";
import { getServerAuth } from "~/utils/getServerAuth";
import "../styles/globals.css";
import { HistoryIndicator } from "~/components/HistoryIndicator";
import { Menu } from "~/components/menu/Menu";
import { NavigationShortcuts } from "~/components/NavigationShortcuts";
import { RouteTracker } from "~/components/RouteTracker";
import { UpdateNotification } from "~/components/updates/UpdateNotification";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://paper.ink"),
  title: {
    default: "Paper",
    template: "%s | Paper",
  },
  description: "reach your people on paper",
};

export const maxDuration = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = await getServerAuth();

  return (
    <html className={`${quicksand.variable} scroll-smooth font-sans`} lang="en">
      <head />
      <body className="flex flex-col relative h-screen overflow-hidden">
        <Providers>
          <UserProvider user={user}>
            <FilteredUsersProvider>
              <DeletedPostsProvider>
                <NotificationsProvider>
                  {/* <BackgroundGradient /> */}
                  <RouteTracker />
                  <NavigationShortcuts />
                  <HistoryIndicator />
                  <UpdateNotification />
                  <Menu isAuthenticated={isAuthenticated} user={user} />

                  {/* <PageTransition> */}
                  <div className="min-w-0 h-full">{children}</div>
                  {/* </PageTransition> */}

                  <FloatingAudioPlayer />
                </NotificationsProvider>
              </DeletedPostsProvider>
            </FilteredUsersProvider>
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
