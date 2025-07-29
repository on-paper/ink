import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { UserNavigation } from "~/components/user/UserNavigation";
import { UserProfile } from "~/components/user/UserProfile";
import { getUserByUsername } from "~/utils/getUserByHandle";

export const maxDuration = 60;
export const revalidate = 0;
export const dynamic = "force-dynamic";

async function UserProfileSection({ handle }: { handle: string }) {
  const user = await getUserByUsername(handle);
  if (!user) return notFound();

  const stats = user.stats || {
    following: 0,
    followers: 0,
    interests: [],
  };

  return (
    <>
      <UserProfile user={user} stats={stats} />
      <UserNavigation handle={handle} />
    </>
  );
}

function UserProfileSkeleton() {
  return (
    <>
      {/* UserProfile skeleton - matching the actual component structure */}
      <div className="p-6 z-20 flex w-full flex-col gap-4 drop-shadow-md mt-4 rounded-xl overflow-hidden">
        <div className="flex flex-row gap-4">
          <div className="flex shrink-0 grow-0 w-12 h-12 sm:w-24 sm:h-24 self-start">
            <Skeleton className="w-full h-full rounded-full" />
          </div>

          <div className="flex flex-col gap-2 flex-grow">
            <div className="flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 sm:h-8 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm">
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile or Follow/Mention buttons */}
        <Skeleton className="h-9 w-full" />
      </div>
      {/* UserNavigation skeleton */}
      <nav className="sticky top-3 w-full z-[40] overflow-x-auto px-4">
        <div className="flex flex-row relative justify-around">
          <div className="h-10 flex-1 inline-flex gap-1.5 items-start justify-center pt-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="h-10 flex-1 inline-flex gap-1.5 items-start justify-center pt-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="h-10 flex-1 inline-flex gap-1.5 items-start justify-center pt-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </nav>
    </>
  );
}

export default function layout({ children, params }: { children: React.ReactNode; params: { user: string } }) {
  return (
    <div className="flex flex-col p-4 py-0 overflow-x-hidden">
      <Suspense fallback={<UserProfileSkeleton />}>
        <UserProfileSection handle={params.user} />
      </Suspense>

      <div className="z-[30]">{children}</div>
    </div>
  );
}
