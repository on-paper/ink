"use client";

import { useState } from "react";
import { Feed } from "../Feed";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { type User } from "./User";
import { UserView } from "./UserView";

interface UserFollowingProps {
  user: User;
  followingCount: number;
  followersCount: number;
}

export const UserFollowing = ({ user, followingCount, followersCount }: UserFollowingProps) => {
  const [activeTab, setActiveTab] = useState("followers");
  const namespaceParam = user.namespace === "eth" ? "?namespace=eth" : "";

  return (
    <Dialog>
      <DialogTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {followersCount} followers
      </DialogTrigger>
      <DialogContent className="max-w-lg backdrop-blur-md bg-card/60">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">Followers ({followersCount})</TabsTrigger>
            <TabsTrigger value="following">Following ({followingCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="pr-4">
                <Feed ItemView={UserView} endpoint={`/api/user/${user.id}/followers${namespaceParam}`} />
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="following" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="pr-4">
                <Feed ItemView={UserView} endpoint={`/api/user/${user.id}/following${namespaceParam}`} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
