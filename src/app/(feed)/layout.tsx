import type { PropsWithChildren } from "react";
import { ServerSignedIn } from "~/components/auth/ServerSignedIn";
import PostComposer from "~/components/post/PostComposer";
import { Card } from "~/components/ui/card";
import { getServerAuth } from "~/utils/getServerAuth";

export const maxDuration = 60;
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function layout({ children }: PropsWithChildren) {
  const { user } = await getServerAuth();

  return (
    <div className="z-[30] p-4 max-w-3xl mx-auto py-0">
      <ServerSignedIn>
        <div className="pt-4">
          <Card className="p-4">
            <PostComposer user={user ?? undefined} />
          </Card>
        </div>
      </ServerSignedIn>
      {children}
    </div>
  );
}
