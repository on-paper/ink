import type { Post } from "@cartel-sh/ui";
import { BookmarkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useDeletedPosts } from "~/components/DeletedPostsContext";
import { useUserActions } from "~/hooks/useUserActions";
import { getBaseUrl } from "~/utils/getBaseUrl";
import type { MenuContext, MenuItem } from "../components/post/PostMenuConfig";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { useUser } from "../components/user/UserContext";

export const usePostState = (
  post: Post,
  onReply?: () => void,
  onMenuAction?: () => void,
  onEditToggle?: (isEditing: boolean) => void,
) => {
  const router = useRouter();
  const author = post.author;
  const { user } = useUser();
  const { addDeletedPost, removeDeletedPost } = useDeletedPosts();
  const {
    muteUser: muteUserAction,
    unmuteUser: unmuteUserAction,
    blockUser: blockUserAction,
    unblockUser: unblockUserAction,
  } = useUserActions(author, onMenuAction);
  const [isSaved, setIsSaved] = useState(post.reactions?.isBookmarked || false);
  const [isMuted, setIsMuted] = useState(post.author.actions?.muted || false);
  const [isBlocked, setIsBlocked] = useState(post.author.actions?.blocked || false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const baseUrl = getBaseUrl();
  const postLink = `${baseUrl}p/${post.id}`;
  const shareLink = postLink;

  const setEditingQuery = () => {
    if (!post.reactions?.canEdit) {
      toast.error("You don't have permission to edit this post");
      onMenuAction?.();
      return;
    }
    setIsEditing(true);
    onEditToggle?.(true);
    onMenuAction?.();
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    addDeletedPost(post.id);

    const result = await fetch(`/api/posts?id=${post.id}`, {
      method: "DELETE",
    });
    const data = await result.json();

    if (result.ok) {
      toast.success("Post deleted successfully!");
    } else {
      // Revert on error
      removeDeletedPost(post.id);
      toast.error(`${data.error}`);
    }
    onMenuAction?.();
  };

  const deletePost = () => {
    setShowDeleteDialog(true);
  };

  const share = () => {
    // Share functionality is now handled in PostInfo.tsx as a submenu
    onMenuAction?.();
  };

  const handleReply = () => {
    onReply?.();
    onMenuAction?.();
  };

  const handleExpand = () => {
    router.push(`/p/${post.id}`);
    onMenuAction?.();
  };

  const muteUser = async () => {
    setIsMuted(true);
    await muteUserAction();
  };

  const unmuteUser = async () => {
    setIsMuted(false);
    await unmuteUserAction();
  };

  const blockUser = async () => {
    setIsBlocked(true);
    await blockUserAction();
  };

  const unblockUser = async () => {
    setIsBlocked(false);
    await unblockUserAction();
  };

  const savePost = async () => {
    // Optimistically update the state
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    // Show toast with bookmark icon
    toast(newSavedState ? "Post saved" : "Post unsaved", {
      icon: <BookmarkIcon size={16} fill={newSavedState ? "currentColor" : "none"} />,
    });

    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: "POST",
      });
      const result = await response.json();

      // If the request failed, revert the optimistic update
      if (result.result === undefined) {
        setIsSaved(!newSavedState);
        toast.error("Failed to save post");
      }
    } catch (error) {
      // Revert on error
      setIsSaved(!newSavedState);
      toast.error("Failed to save post");
    }

    onMenuAction?.();
  };

  const context: MenuContext = {
    post,
    user,
    isMuted,
    isBlocked,
    isSaved,
    share,
    handleReply,
    handleExpand,
    deletePost,
    setEditingQuery,
    muteUser,
    unmuteUser,
    blockUser,
    unblockUser,
    postLink,
    savePost,
  };

  const shouldShowItem = (item: MenuItem) => {
    switch (item.condition) {
      case "always":
        return true;
      case "isAuthor":
        return user?.id === author.id;
      case "notAuthor":
        return user?.id !== author.id;
      case "hasReply":
        return !!onReply;
      default:
        return true;
    }
  };

  const getItemProps = (item: MenuItem) => {
    const baseProps: any = {
      label: item.label,
      icon: item.icon,
      onClick: item.onClick,
      disabled: item.disabled,
      variant: item.variant,
    };

    // Get the base onClick handler for the item
    let itemProps = baseProps;
    switch (item.id) {
      case "share":
        itemProps = { ...baseProps, onClick: share };
        break;
      case "save":
        itemProps = { ...baseProps, onClick: savePost };
        break;
      case "reply":
        itemProps = { ...baseProps, onClick: handleReply };
        break;
      case "expand":
        itemProps = { ...baseProps, onClick: handleExpand };
        break;
      case "open-new-tab":
        itemProps = { ...baseProps, href: postLink };
        break;
      case "edit-post":
        itemProps = { ...baseProps, onClick: setEditingQuery };
        break;
      case "delete-post":
        itemProps = { ...baseProps, onClick: deletePost };
        break;
    }

    // Apply dynamic props on top of base props
    if (item.getDynamicProps) {
      return { ...itemProps, ...item.getDynamicProps(context) };
    }

    return itemProps;
  };

  const DeleteDialog = () => (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="p-0 gap-0 max-w-xs rounded-2xl">
        <div className="flex flex-col items-center p-6">
          <div className="w-16 h-16 mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Delete post?</h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            This action cannot be undone. This post will be permanently deleted.
          </p>
        </div>
        <div className="flex w-full h-12">
          <Button
            variant="ghost"
            onClick={() => setShowDeleteDialog(false)}
            className="w-1/2 rounded-none rounded-bl-lg border-t border-r hover:bg-muted/50"
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            onClick={confirmDelete}
            className="w-1/2 rounded-none rounded-br-lg border-t text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return {
    context,
    shouldShowItem,
    getItemProps,
    postLink,
    isSaved,
    isEditing,
    setIsEditing,
    DeleteDialog,
  };
};
