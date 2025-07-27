"use client";

import type { Post } from "@cartel-sh/ui";
import type { PropsWithChildren } from "react";
import Link from "~/components/Link";
import { ContextMenu as Context, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { menuItems } from "./PostMenuConfig";
import { usePostStateContext } from "./PostStateContext";

export const PostContextMenu = (props: PropsWithChildren & { post: Post; onReply?: () => void }) => {
  const { shouldShowItem, getItemProps, postLink, isSaved } = usePostStateContext();

  return (
    <Context>
      <ContextMenuContent
        onContextMenu={(e) => {
          e.stopPropagation();
        }}
        className="w-max"
      >
        {menuItems.map((item) => {
          if (!shouldShowItem(item)) return null;

          const itemProps = getItemProps(item);
          const Icon = itemProps.icon;

          if (item.id === "open-new-tab") {
            return (
              <ContextMenuItem key={item.id} asChild>
                <Link href={postLink} referrerPolicy="no-referrer" target="_blank" className="flex items-center gap-3">
                  <Icon size={12} className="h-4 w-4" />
                  {itemProps.label}
                </Link>
              </ContextMenuItem>
            );
          }

          return (
            <ContextMenuItem
              key={item.id}
              onClick={itemProps.onClick}
              disabled={itemProps.disabled}
              className="flex items-center gap-3"
            >
              <Icon size={12} className="h-4 w-4" fill={item.id === "save" && isSaved ? "currentColor" : "none"} />
              {itemProps.label}
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
      <ContextMenuTrigger>{props.children}</ContextMenuTrigger>
    </Context>
  );
};
