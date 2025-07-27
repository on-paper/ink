"use client";

import type { Group } from "@cartel-sh/ui";
import { Users } from "lucide-react";
import Link from "~/components/Link";
import { useUser } from "~/components/user/UserContext";
import { useGroupMutations } from "~/hooks/useGroupMutations";
import { useGroupStats } from "~/hooks/useGroupStats";
import { formatNumber } from "~/utils/formatNumber";
import { resolveUrl } from "~/utils/resolveUrl";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface GroupViewProps {
  group: Group;
  isVertical?: boolean;
  showJoin?: boolean;
}

function MemberCount({ groupId }: { groupId: string }) {
  const { data, isLoading } = useGroupStats(groupId);

  if (isLoading) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground mt-1">
      {formatNumber(data.totalMembers)} {data.totalMembers === 1 ? "member" : "members"}
    </p>
  );
}

export function GroupView({ group, isVertical = false, showJoin = true }: GroupViewProps) {
  const groupUrl = `/c/${group.address}`;
  const iconUrl = resolveUrl(group.metadata?.icon);
  const canJoin = group.operations?.canJoin || false;
  const canLeave = group.operations?.canLeave || false;
  const { isAuthenticated } = useUser();
  const { joinMutation, leaveMutation } = useGroupMutations(group.address);

  const handleJoinLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (canJoin) {
      joinMutation.mutate();
    } else if (canLeave) {
      leaveMutation.mutate();
    }
  };

  return (
    <Link href={groupUrl} className="block ">
      <Card className="transition-colors cursor-pointer hover:bg-muted/30">
        <CardContent className="p-4 ">
          <div className={isVertical ? "flex flex-col items-center text-center" : "flex items-center gap-3"}>
            <div className="flex-shrink-0">
              {group.metadata?.icon ? (
                <img
                  src={iconUrl}
                  alt={group.metadata?.name || group.address}
                  className={isVertical ? "w-20 h-20 rounded-xl object-cover" : "w-12 h-12 rounded-xl object-cover"}
                />
              ) : (
                <div
                  className={
                    isVertical
                      ? "w-20 h-20 rounded-xl bg-secondary flex items-center justify-center"
                      : "w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"
                  }
                >
                  <Users className={isVertical ? "w-10 h-10 text-muted-foreground" : "w-6 h-6 text-muted-foreground"} />
                </div>
              )}
            </div>

            <div className={isVertical ? "mt-3" : "flex-1 min-w-0"}>
              <h3 className={isVertical ? "font-semibold text-base" : "font-semibold text-base truncate"}>
                {group.metadata?.name || `Group ${group.address.slice(0, 6)}...${group.address.slice(-4)}`}
              </h3>

              <MemberCount groupId={group.address} />
            </div>

            {showJoin && isAuthenticated && (canJoin || canLeave) && (
              <Button
                size={isVertical ? "sm" : "default"}
                variant={canLeave ? "outline" : "default"}
                onClick={handleJoinLeave}
                className={isVertical ? "mt-3 w-full" : "flex-shrink-0 px-6"}
              >
                {canLeave ? "Leave" : "Join"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
