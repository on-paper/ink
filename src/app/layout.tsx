import type { Metadata } from "next";
import Script from "next/script";
import { DeletedPostsProvider } from "~/components/DeletedPostsContext";
import { FilteredUsersProvider } from "~/components/FilteredUsersContext";
import { FloatingAudioPlayer } from "~/components/FloatingAudioPlayer";
import { NotificationsProvider } from "~/components/notifications/NotificationsContext";
import { PageTransition } from "~/components/PageTransition";
import { Providers } from "~/components/Providers";
import { UserProvider } from "~/components/user/UserContext";
import { quicksand } from "~/styles/fonts";
import { getServerAuth } from "~/utils/getServerAuth";
import "../styles/globals.css";
import { HistoryIndicator } from "~/components/HistoryIndicator";
import { Menu } from "~/components/menu/Menu";
import { NavigationShortcuts } from "~/components/NavigationShortcuts";
import { RouteTracker } from "~/components/RouteTracker";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pingpad.io"),
  title: {
    default: "Pingpad",
    template: "%s | Pingpad",
  },
  description: "reach your people on pingpad",
};

export const maxDuration = 60;

export default async function RootLayout({ children }) {
  const { handle, isAuthenticated, user } = await getServerAuth();

  return (
    <html className={`${quicksand.variable} scroll-smooth font-sans`} lang="en">
      <head>
        <Script defer src="https://stats.kualta.dev/script.js" data-website-id="b3bf05cd-46cc-4199-a5c0-aeaf3d70d311" />
      </head>
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
                  <Menu isAuthenticated={isAuthenticated} user={user} handle={handle} />

                  <PageTransition>
                    <div className="min-w-0 max-w-2xl mx-auto grow sm:shrink lg:max-w-2xl h-full">{children}</div>
                  </PageTransition>

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
