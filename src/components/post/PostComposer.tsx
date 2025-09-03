"use client";

import type { Post, User } from "@cartel-sh/ui";
import { isImageMetadata, isVideoMetadata } from "@cartel-sh/ui";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, LogInIcon, SendHorizontalIcon, VideoIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/src/components/ui/form";
import { CommunityIcon } from "~/components/communities/CommunityIcon";
import { useUser } from "~/components/user/UserContext";
import { useEthereumEdit } from "~/hooks/useEthereumEdit";
import { useEthereumPost } from "~/hooks/useEthereumPost";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { storageClient } from "~/utils/lens/storage";

export const MAX_CONTENT_LENGTH = 1000;

import { useAtomValue, useSetAtom } from "jotai";
import {
  deleteDraftAtomFamily,
  draftsAtomFamily,
  generateDraftId,
  type PostDraft,
  upsertDraftAtomFamily,
} from "~/atoms/drafts";
import { useCommunity } from "~/hooks/useCommunity";
import { normalizeImageMimeType, normalizeVideoMimeType } from "~/utils/mimeTypes";
import { LexicalEditorWrapper } from "../composer/LexicalEditor";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { UserAvatar } from "../user/UserAvatar";
import { truncateEthAddress } from "../web3/Address";
import { DraftsDialog } from "./DraftsDialog";
import { PostComposerActions } from "./PostComposerActions";
import { ComposerProvider, useComposer } from "./PostComposerContext";
import { PostQuotePreview } from "./PostQuotePreview";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

type MediaItem = { type: "file"; file: File; id: string } | { type: "url"; url: string; mimeType: string; id: string };

const FormSchema = z.object({
  content: z.string().max(MAX_CONTENT_LENGTH, {
    message: `Post must not be longer than ${MAX_CONTENT_LENGTH} characters.`,
  }),
});

const MediaItem = ({ item, index, onRemove }: { item: MediaItem; index: number; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isVideo = item.type === "file" ? item.file.type.startsWith("video/") : item.mimeType.startsWith("video/");
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (item.type === "file") {
      const objectUrl = URL.createObjectURL(item.file);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setUrl(item.url);
  }, [item]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border ${isDragging ? "opacity-50 z-50" : ""}`}
    >
      <div className="aspect-square relative">
        <div {...attributes} {...listeners} className="absolute inset-0 cursor-move z-10">
          {isVideo ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <VideoIcon className="w-8 h-8 text-muted-foreground" />
              <video src={url} className="absolute inset-0 w-full h-full object-fit opacity-50" />
            </div>
          ) : (
            <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-1 right-1 p-1 bg-black/20 backdrop-blur-sm rounded-full text-white/80 hover:bg-black/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const MediaPreview = ({
  files,
  onRemove,
  onReorder,
}: {
  files: MediaItem[];
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (files.length === 0) return null;

  const fileIds = files.map((f) => f.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fileIds.indexOf(active.id as string);
      const newIndex = fileIds.indexOf(over.id as string);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fileIds} strategy={rectSortingStrategy}>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {files.map((item, index) => (
            <MediaItem key={item.id} item={item} index={index} onRemove={() => onRemove(item.id)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export interface PostComposerProps {
  user?: User;
  replyingTo?: Post;
  quotedPost?: Post;
  editingPost?: Post;
  initialContent?: string;
  community?: string;
  onSuccess?: (post?: Post | null) => void;
  onCancel?: () => void;
  isReplyingToComment?: boolean;
  onContentChange?: (content: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

function ComposerContent() {
  const { user: contextUser, requireAuth } = useUser();
  const pathname = usePathname();

  const {
    user,
    replyingTo,
    quotedPost,
    editingPost,
    initialContent = "",
    community,
    isReplyingToComment = false,
    onSuccess,
    onCancel,
    onDirtyChange,
    onContentChange,
    registerImperativeApi,
  } = useComposer();

  const currentUser = user || contextUser;
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(undefined);
  const currentDraftCreatedAtRef = useRef<number | null>(null);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const closeConfirmResolverRef = useRef<((canClose: boolean) => void) | null>(null);
  const draftsUserId = currentUser?.id || currentUser?.address || undefined;
  const isReply = Boolean(replyingTo);
  const communityFromPath = pathname.split("/")[1] === "c" ? pathname.split("/")[2] : "";
  const replyingToChannel = (replyingTo as any)?.metadata?.channel as { id?: string } | undefined;
  const replyingToChannelId = replyingToChannel?.id;
  const channelIdForContext = replyingToChannelId || community || communityFromPath || undefined;
  const isChannelComposer = Boolean(channelIdForContext);

  // Drafts state via Jotai persistent storage
  const drafts = useAtomValue(draftsAtomFamily(draftsUserId));
  const upsertDraftAtom = useSetAtom(upsertDraftAtomFamily(draftsUserId));
  const deleteDraftAtom = useSetAtom(deleteDraftAtomFamily(draftsUserId));

  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);
  const [selectedChannelName, setSelectedChannelName] = useState<string | undefined>(undefined);
  const { data: currentCommunity } = useCommunity(isChannelComposer ? channelIdForContext : undefined);
  const [channels, setChannels] = useState<Array<{ address: string; metadata?: { name?: string } }>>([]);
  const [isChannelsLoading, setIsChannelsLoading] = useState(false);

  useEffect(() => {
    if (isChannelComposer || isReply) return;
    let aborted = false;
    const controller = new AbortController();
    setIsChannelsLoading(true);
    (async () => {
      try {
        const collected: Array<{ address: string; metadata?: { name?: string } }> = [];
        let cursor: string | undefined;
        let pages = 0;
        const maxPages = 5;
        while (!aborted && pages < maxPages) {
          const url = `/api/communities?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) break;
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : [];
          collected.push(...list);
          if (!json?.nextCursor) break;
          cursor = json.nextCursor as string;
          pages += 1;
        }
        if (!aborted) setChannels(collected);
      } catch {
        // ignore
      } finally {
        if (!aborted) setIsChannelsLoading(false);
      }
    })();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [isChannelComposer, isReply]);

  const { postMutation: post, isPosting: isPostingNew } = useEthereumPost({
    onSuccess: () => {
      onSuccess?.(null);
      form.setValue("content", "");
      setMediaFiles([]);
      setSelectedChannelId(undefined);
      setSelectedChannelName(undefined);
      if (replyingTo || quotedPost) {
        onCancel?.();
      }
    },
  });

  const { editMutation: edit, isEditing: isEditingPost } = useEthereumEdit({
    onSuccess: () => {
      onSuccess?.(null);
      form.setValue("content", "");
      setMediaFiles([]);
      onCancel?.();
    },
  });

  const isPosting = editingPost ? isEditingPost : isPostingNew;

  const pathSegments = pathname.split("/");
  const communityFromPath2 = pathSegments[1] === "c" ? pathSegments[2] : "";
  const finalCommunity = community || communityFromPath2;

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: editingPost?.metadata?.content || initialContent,
    },
  });

  const watchedContent = form.watch("content");
  const isEmpty = !watchedContent.trim() && mediaFiles.length === 0;

  // Inform parent of dirty state/content
  useEffect(() => {
    onDirtyChange?.(!isEmpty && !editingPost && !isReply);
    onContentChange?.(watchedContent);
  }, [watchedContent, isEmpty, editingPost, isReply]);

  // Auto-save on component unmount
  const saveCurrentStateRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    saveCurrentStateRef.current = () => {
      // Only save if we have content and this is not an edit or reply
      if (editingPost || isReply) return;
      const trimmed = watchedContent.trim();
      const hasContent = trimmed.length > 0 || mediaFiles.length > 0;
      if (!hasContent) return;

      const id = currentDraftId || generateDraftId();
      const draft: PostDraft = {
        id,
        content: watchedContent,
        createdAt: currentDraftCreatedAtRef.current || Date.now(),
        updatedAt: Date.now(),
        context: {
          community,
          replyingToId: replyingTo?.id,
          quotedPostId: quotedPost?.id,
        },
      };

      upsertDraftAtom(draft);
    };
  });

  useEffect(() => {
    return () => {
      saveCurrentStateRef.current?.();
    };
  }, []);

  // Save on unload just in case
  useEffect(() => {
    if (editingPost || isReply) return;
    const beforeUnload = () => {
      const trimmed = watchedContent.trim();
      if (trimmed.length === 0 && mediaFiles.length === 0) return;
      const id = currentDraftId || generateDraftId();
      if (!currentDraftId) setCurrentDraftId(id);
      if (!currentDraftCreatedAtRef.current) currentDraftCreatedAtRef.current = Date.now();
      const draft: PostDraft = {
        id,
        content: watchedContent,
        createdAt: currentDraftCreatedAtRef.current || Date.now(),
        updatedAt: Date.now(),
        context: { community, replyingToId: replyingTo?.id, quotedPostId: quotedPost?.id },
      };
      upsertDraftAtom(draft);
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [
    watchedContent,
    mediaFiles.length,
    editingPost,
    isReply,
    community,
    replyingTo?.id,
    quotedPost?.id,
    draftsUserId,
    currentDraftId,
    upsertDraftAtom,
  ]);

  useEffect(() => {
    if (!isPosting) return;
  }, [isPosting]);

  useEffect(() => {
    if (editingPost?.metadata) {
      const existingMedia: MediaItem[] = [];
      const metadata = editingPost.metadata;

      if (isImageMetadata(metadata) && metadata.image?.item) {
        existingMedia.push({
          type: "url",
          url: metadata.image.item,
          mimeType: normalizeImageMimeType(metadata.image.type) || "image/jpeg",
          id: `existing-${Date.now()}-0`,
        });
      } else if (isVideoMetadata(metadata) && metadata.video?.item) {
        existingMedia.push({
          type: "url",
          url: metadata.video.item,
          mimeType: normalizeVideoMimeType(metadata.video.type) || "video/mp4",
          id: `existing-${Date.now()}-0`,
        });
      }

      setMediaFiles(existingMedia);
    }
  }, [editingPost]);

  // Media handlers
  const handleAddFiles = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum file size is 8MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles: MediaItem[] = validFiles.map((file) => ({
        type: "file",
        file,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const removeMedia = useCallback((id: string) => {
    setMediaFiles((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reorderMedia = useCallback((from: number, to: number) => {
    setMediaFiles((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(from, 1);
      result.splice(to, 0, removed);
      return result;
    });
  }, []);

  const processMediaForSubmission = useCallback(
    async (toastId?: string) => {
      if (mediaFiles.length === 0) {
        return { uploadedMedia: [] };
      }

      try {
        if (toastId) {
          toast.loading(`Uploading ${mediaFiles.length} file${mediaFiles.length > 1 ? "s" : ""}...`, { id: toastId });
        }

        const uploadPromises = mediaFiles.map(async (item, index) => {
          try {
            if (item.type === "file") {
              const { uri } = await storageClient.uploadFile(item.file);
              return { uri, type: item.file.type, originalId: item.id };
            }
            return { uri: item.url, type: item.mimeType, originalId: item.id };
          } catch (error) {
            console.error(`Failed to upload file ${index + 1}:`, error);
            throw new Error(
              `Failed to upload ${item.type === "file" ? item.file.name : "file"}: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        });

        const uploadedMedia = await Promise.all(uploadPromises);

        return {
          uploadedMedia,
        };
      } catch (error) {
        if (toastId) {
          toast.dismiss(toastId);
        }
        throw error;
      }
    },
    [mediaFiles],
  );

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => handleAddFiles(acceptedFiles), [handleAddFiles]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    noClick: true,
    noKeyboard: true,
  });

  // Submit handler
  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!requireAuth()) return;

    let finalContent = data.content;

    // Process media files
    if (mediaFiles.length > 0) {
      const toastId = "upload-media";
      try {
        toast.loading("Uploading media...", { id: toastId });
        const { uploadedMedia } = await processMediaForSubmission(toastId);

        // Append all media URLs to content
        if (uploadedMedia && uploadedMedia.length > 0) {
          uploadedMedia.forEach((media) => {
            finalContent += `\n${media.uri}`;
          });
        }
        toast.dismiss(toastId);
      } catch (error) {
        toast.error("Failed to upload media", { id: toastId });
        return;
      }
    }

    if (quotedPost) {
      const quotePath = `/p/${quotedPost.id}`;
      const alreadyHasQuoteUrl = finalContent.includes(quotePath);
      if (!alreadyHasQuoteUrl) {
        const quoteUrl = `${getBaseUrl()}${quotePath}`;
        finalContent += `\n\nQuoting: ${quoteUrl}`;
      }
    }

    if (editingPost) {
      edit({
        postId: editingPost.id,
        content: finalContent,
        metadata: [], // TODO: Add metadata support if needed
      });
    } else {
      post({
        content: finalContent,
        parentId: replyingTo?.id,
        channelId: selectedChannelId || channelIdForContext,
      });
      // Remove current draft on submit
      if (currentDraftId) {
        deleteDraftAtom(currentDraftId);
        setCurrentDraftId(undefined);
        currentDraftCreatedAtRef.current = null;
      }
    }
  }

  const handleEmojiClick = useCallback(
    (emoji: any) => {
      if (!requireAuth()) return;
      const content = form.getValues("content");
      form.setValue("content", content + emoji.emoji, { shouldValidate: true });
    },
    [form, requireAuth],
  );

  // Drafts listing and actions
  const loadDraftIntoComposer = (draftId: string) => {
    const d = drafts.find((dr) => dr.id === draftId);
    if (!d) return;
    form.setValue("content", d.content, { shouldValidate: true });
    setCurrentDraftId(draftId);
    currentDraftCreatedAtRef.current = d.createdAt;
    setIsDraftsOpen(false);
  };
  const discardCurrentDraft = () => {
    if (currentDraftId) {
      deleteDraftAtom(currentDraftId);
      setCurrentDraftId(undefined);
      currentDraftCreatedAtRef.current = null;
    }
  };
  const saveCurrentDraft = () => {
    const trimmed = watchedContent.trim();
    if (editingPost || isReply || (trimmed.length === 0 && mediaFiles.length === 0)) return;
    const id = currentDraftId || generateDraftId();
    const draft: PostDraft = {
      id,
      content: watchedContent,
      createdAt: currentDraftCreatedAtRef.current || Date.now(),
      updatedAt: Date.now(),
      context: { community, replyingToId: replyingTo?.id, quotedPostId: quotedPost?.id },
    };
    if (!currentDraftCreatedAtRef.current) currentDraftCreatedAtRef.current = draft.createdAt;
    upsertDraftAtom(draft);
    if (!currentDraftId) setCurrentDraftId(id);
  };

  useEffect(() => {
    registerImperativeApi?.({
      saveDraft: saveCurrentDraft,
      discardDraft: discardCurrentDraft,
      getIsDirty: () => !isEmpty && !editingPost && !isReply,
      confirmClose: () => {
        if (isEmpty || editingPost || isReply) return Promise.resolve(true);
        setIsCloseConfirmOpen(true);
        return new Promise<boolean>((resolve) => {
          closeConfirmResolverRef.current = resolve;
        });
      },
    });
  }, [registerImperativeApi, saveCurrentDraft, discardCurrentDraft, isEmpty, editingPost, isReply]);

  // Focus tracking on editor area
  const focusTimerRef = useRef<number | null>(null);
  const handleFocusIn = () => {
    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    setIsFocused(true);
  };
  const handleFocusOut = () => {
    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => setIsFocused(false), 120);
  };

  const placeholderText = editingPost
    ? "edit your post..."
    : replyingTo
      ? "write your reply..."
      : quotedPost
        ? "add your thoughts..."
        : initialContent?.includes("@lens/")
          ? "mention user..."
          : "write a new post...";

  const isSmallAvatar = replyingTo && isReplyingToComment;

  if (!currentUser) {
    return (
      <div className="w-full">
        <div className="flex flex-row gap-4 w-full items-center">
          <div className={`shrink-0 z-20 grow-0 rounded-full ${isSmallAvatar ? "w-6 h-6" : "w-10 h-10"}`}>
            <div
              className={`rounded-full bg-muted flex items-center justify-center ${isSmallAvatar ? "w-6 h-6" : "w-10 h-10"}`}
            >
              <LogInIcon className={`text-muted-foreground opacity-60 ${isSmallAvatar ? "w-3 h-3" : "w-4 h-4"}`} />
            </div>
          </div>
          <div className="grow flex-1">
            <div className="text-muted-foreground/80">
              {replyingTo ? (
                <>
                  {"Please "}
                  <Link href="/login" className="underline hover:text-foreground">
                    login
                  </Link>
                  {" to comment"}
                </>
              ) : (
                <>
                  {"Please "}
                  <Link href="/login" className="underline hover:text-foreground">
                    login
                  </Link>
                  {" to post"}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full"
      {...getRootProps()}
      onClick={(e) => e.stopPropagation()}
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 bg-black/20 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary">
          <p className="text-white text-lg">Drop image to upload</p>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <div className="flex flex-row gap-4 w-full">
            <div className={`shrink-0 z-20 grow-0 rounded-full ${isSmallAvatar ? "w-6 h-6" : "w-10 h-10"}`}>
              <UserAvatar user={currentUser} />
            </div>
            <div className="grow flex-1">
              <div className="flex h-5 gap-1.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm">
                    {currentUser.username || truncateEthAddress(currentUser.address)}
                  </span>
                  {editingPost && <span className="text-muted-foreground text-xs sm:text-sm">editing</span>}
                </div>
                {!editingPost && !isReply && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <ChevronRight strokeWidth={2.2} className="w-4 h-4 -mx-1" />
                    {isChannelComposer ? (
                      currentCommunity?.metadata?.name ? (
                        <span className="font-bold truncate max-w-[10rem] inline-block align-bottom">
                          {currentCommunity.metadata.name}
                        </span>
                      ) : (
                        <span className="inline-block h-4 w-16 rounded-full bg-muted animate-pulse" />
                      )
                    ) : (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="hover:text-foreground transition-colors">
                            {selectedChannelName || "global"}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-56 p-0 overflow-hidden">
                          <ScrollArea className="max-h-72">
                            <div className="p-1">
                              {isChannelsLoading && (
                                <DropdownMenuItem disabled className="text-muted-foreground h-8 text-sm">
                                  Loading channels...
                                </DropdownMenuItem>
                              )}
                              {!isChannelsLoading && channels.length === 0 && (
                                <DropdownMenuItem disabled className="text-muted-foreground h-8 text-sm">
                                  No channels available
                                </DropdownMenuItem>
                              )}
                              {channels.map((ch) => {
                                const name = ch.metadata?.name || ch.address;
                                return (
                                  <DropdownMenuItem
                                    key={ch.address}
                                    onClick={() => {
                                      setSelectedChannelId(ch.address);
                                      setSelectedChannelName(name);
                                    }}
                                    className="h-9 text-sm flex items-center gap-2"
                                  >
                                    <CommunityIcon community={ch} size="sm" className="w-6 h-6" />
                                    <span className="truncate">{name}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {editingPost && onCancel && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-transparent hover:scale-105 active:scale-95 button-hover-bg button-hover-bg-equal"
                      onClick={onCancel}
                      disabled={isPosting}
                    >
                      <X
                        size={18}
                        strokeWidth={2.2}
                        stroke="hsl(var(--muted-foreground))"
                        className="transition-all duration-200"
                      />
                    </Button>
                  )}
                </div>
              </div>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormControl>
                      <div {...getRootProps()}>
                        <LexicalEditorWrapper
                          value={field.value}
                          onChange={(value) => {
                            if (!requireAuth()) return;
                            field.onChange(value);
                            onContentChange?.(value);
                          }}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                              onSubmit(form.getValues());
                            }
                          }}
                          onPasteFiles={handleAddFiles}
                          placeholder={placeholderText}
                          disabled={isPosting}
                          focusAtStart={Boolean(quotedPost)}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <PostComposerActions
                onImageClick={open}
                onEmojiClick={handleEmojiClick}
                onDraftsClick={() => setIsDraftsOpen(true)}
              />
              <MediaPreview files={mediaFiles} onRemove={removeMedia} onReorder={reorderMedia} />
              {quotedPost && <PostQuotePreview quotedPost={quotedPost} />}

              {editingPost && (
                <div className="mt-4">
                  <Button disabled={isPosting || isEmpty} type="submit" className="w-full">
                    {isPosting ? (
                      <span className="flex items-center gap-2">
                        <LoadingSpinner />
                        <span>Updating...</span>
                      </span>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              )}
            </div>
            {!editingPost && (
              <Button disabled={isPosting || isEmpty} size="icon" type="submit" className="h-8 w-8 self-start">
                {isPosting ? <LoadingSpinner /> : <SendHorizontalIcon className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </Form>

      <DraftsDialog
        isOpen={isDraftsOpen}
        onOpenChange={setIsDraftsOpen}
        onLoadDraft={loadDraftIntoComposer}
        currentDraftId={currentDraftId}
        draftsUserId={draftsUserId}
        onCurrentDraftChange={(draftId, createdAt) => {
          setCurrentDraftId(draftId);
          currentDraftCreatedAtRef.current = createdAt;
        }}
      />

      {/* Close confirmation (centralized) */}
      <Dialog
        open={isCloseConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCloseConfirmOpen(false);
            if (closeConfirmResolverRef.current) {
              closeConfirmResolverRef.current(false);
              closeConfirmResolverRef.current = null;
            }
          } else {
            setIsCloseConfirmOpen(true);
          }
        }}
      >
        <DialogContent className="p-0 gap-0 max-w-xs rounded-2xl">
          <div className="flex flex-col items-center p-6">
            <h2 className="text-lg font-semibold">Save draft?</h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              You can save this to send later from your drafts.
            </p>
          </div>
          <div className="flex w-full h-12">
            <Button
              variant="ghost"
              onClick={() => {
                discardCurrentDraft();
                setIsCloseConfirmOpen(false);
                if (closeConfirmResolverRef.current) {
                  closeConfirmResolverRef.current(true);
                  closeConfirmResolverRef.current = null;
                }
              }}
              className="w-1/2 rounded-none rounded-bl-lg border-t border-r hover:bg-muted/50"
            >
              Discard
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                saveCurrentDraft();
                setIsCloseConfirmOpen(false);
                if (closeConfirmResolverRef.current) {
                  closeConfirmResolverRef.current(true);
                  closeConfirmResolverRef.current = null;
                }
              }}
              className="w-1/2 rounded-none rounded-br-lg border-t hover:bg-muted/50"
            >
              Save Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type PostComposerHandle = {
  getIsDirty: () => boolean;
  saveDraft: () => void;
  discardDraft: () => void;
  confirmClose: () => Promise<boolean>;
};

const ForwardedPostComposer = forwardRef<PostComposerHandle, PostComposerProps>(
  function PostComposerForwarded(props, ref) {
    const apiRef = useRef<PostComposerHandle | null>(null);
    const registerImperativeApi = (api: PostComposerHandle) => {
      apiRef.current = api;
    };
    useImperativeHandle(ref, () => ({
      getIsDirty: () => apiRef.current?.getIsDirty?.() || false,
      saveDraft: () => apiRef.current?.saveDraft?.(),
      discardDraft: () => apiRef.current?.discardDraft?.(),
      confirmClose: () => apiRef.current?.confirmClose?.() || Promise.resolve(true),
    }));
    return (
      <ComposerProvider value={{ ...props, registerImperativeApi }}>
        <ComposerContent />
      </ComposerProvider>
    );
  },
);

export default ForwardedPostComposer;
