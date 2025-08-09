"use client";

import type { Post, User } from "@cartel-sh/ui";
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
import { ChevronRight, SendHorizontalIcon, VideoIcon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/src/components/ui/form";
import { useUser } from "~/components/user/UserContext";
import { useEthereumEdit } from "~/hooks/useEthereumEdit";
import { useEthereumPost } from "~/hooks/useEthereumPost";
import { storageClient } from "~/utils/lens/storage";
import { getBaseUrl } from "~/utils/getBaseUrl";

export const MAX_CONTENT_LENGTH = 1000;

import {
  castToMediaImageType,
  castToMediaVideoType,
  normalizeImageMimeType,
  normalizeVideoMimeType,
} from "~/utils/mimeTypes";
import { LexicalEditorWrapper } from "../composer/LexicalEditor";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserAvatar } from "../user/UserAvatar";
import { PostComposerActions } from "./PostComposerActions";
import { ComposerProvider, useComposer } from "./PostComposerContext";
import { PostQuotePreview } from "./PostQuotePreview";
import { truncateEthAddress } from "../web3/Address";
import { useCommunity } from "~/hooks/useCommunity";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDate } from "~/utils/formatDate";
import { useAtomValue, useSetAtom } from "jotai";
import {
  draftsAtomFamily,
  generateDraftId,
  type PostDraft,
  upsertDraftAtomFamily,
  deleteDraftAtomFamily,
} from "~/atoms/drafts";

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
  feed?: string;
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
    feed,
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
  const isChannelComposer = Boolean(feed);

  // Drafts state via Jotai persistent storage
  const drafts = useAtomValue(draftsAtomFamily(draftsUserId));
  const upsertDraftAtom = useSetAtom(upsertDraftAtomFamily(draftsUserId));
  const deleteDraftAtom = useSetAtom(deleteDraftAtomFamily(draftsUserId));

  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);
  const [selectedChannelName, setSelectedChannelName] = useState<string | undefined>(undefined);
  const { data: currentCommunity } = useCommunity(isChannelComposer ? feed : undefined);
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
        let cursor: string | undefined = undefined;
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
  const communityFromPath = pathSegments[1] === "c" ? pathSegments[2] : "";
  const finalCommunity = community || communityFromPath;

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

  useEffect(() => {
    if (editingPost || isReply) return;
    const trimmed = watchedContent.trim();
    const hasContent = trimmed.length > 0 || mediaFiles.length > 0;
    if (!hasContent) return;

    const id = currentDraftId || generateDraftId();
    if (!currentDraftId) setCurrentDraftId(id);
    if (!currentDraftCreatedAtRef.current) currentDraftCreatedAtRef.current = Date.now();

    const draft: PostDraft = {
      id,
      content: watchedContent,
      createdAt: currentDraftCreatedAtRef.current || Date.now(),
      updatedAt: Date.now(),
      context: {
        community,
        feed,
        replyingToId: replyingTo?.id,
        quotedPostId: quotedPost?.id,
      },
    };

    const handle = setTimeout(() => {
      upsertDraftAtom(draft);
    }, 400);
    return () => clearTimeout(handle);
  }, [watchedContent, mediaFiles.length, editingPost, isReply, community, feed, replyingTo?.id, quotedPost?.id, draftsUserId, currentDraftId, upsertDraftAtom]);

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
        context: { community, feed, replyingToId: replyingTo?.id, quotedPostId: quotedPost?.id },
      };
      upsertDraftAtom(draft);
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [watchedContent, mediaFiles.length, editingPost, isReply, community, feed, replyingTo?.id, quotedPost?.id, draftsUserId, currentDraftId, upsertDraftAtom]);

  // When posting succeeds, clear draft if any
  useEffect(() => {
    if (!isPosting) return;
  }, [isPosting]);

  useEffect(() => {
    if (editingPost?.metadata) {
      const existingMedia: MediaItem[] = [];
      const metadata = editingPost.metadata;

      if (metadata.__typename === "ImageMetadata" && metadata.image?.item) {
        existingMedia.push({
          type: "url",
          url: metadata.image.item,
          mimeType: normalizeImageMimeType(metadata.image.type) || "image/jpeg",
          id: `existing-${Date.now()}-0`,
        });
      } else if (metadata.__typename === "VideoMetadata" && metadata.video?.item) {
        existingMedia.push({
          type: "url",
          url: metadata.video.item,
          mimeType: normalizeVideoMimeType(metadata.video.type) || "video/mp4",
          id: `existing-${Date.now()}-0`,
        });
      }

      if (metadata.attachments && Array.isArray(metadata.attachments)) {
        metadata.attachments.forEach((att: any, index: number) => {
          if (att.item) {
            existingMedia.push({
              type: "url",
              url: att.item,
              mimeType: att.type || "image/jpeg",
              id: `existing-${Date.now()}-${index + 1}`,
            });
          }
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
        return { primaryMedia: null, attachments: undefined };
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
            throw new Error(`Failed to upload ${item.type === "file" ? item.file.name : "file"}: ${error.message}`);
          }
        });

        const uploadedMedia = await Promise.all(uploadPromises);

        const primaryMedia = uploadedMedia[0] || null;
        const attachments =
          uploadedMedia.length > 1
            ? uploadedMedia
              .slice(1)
              .map((m) => {
                if (m.type.startsWith("image/")) {
                  return {
                    item: m.uri,
                    type: castToMediaImageType(m.type),
                  };
                }
                if (m.type.startsWith("video/")) {
                  return {
                    item: m.uri,
                    type: castToMediaVideoType(m.type),
                  };
                }
                return null;
              })
              .filter(Boolean)
            : undefined;

        return {
          primaryMedia,
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
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
        const { primaryMedia, attachments } = await processMediaForSubmission(toastId);

        // Append media URLs to content
        if (primaryMedia) {
          finalContent += `\n\n${primaryMedia.uri}`;
        }
        if (attachments) {
          attachments.forEach((att: any) => {
            finalContent += `\n${att.item}`;
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
        channelId: selectedChannelId || feed || community,
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
      context: { community, feed, replyingToId: replyingTo?.id, quotedPostId: quotedPost?.id },
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

  return (
    <div className="w-full" {...getRootProps()} onClick={(e) => e.stopPropagation()} onFocusCapture={handleFocusIn} onBlurCapture={handleFocusOut}>
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
                    {currentUser?.username || truncateEthAddress(currentUser?.address)}
                  </span>
                  {editingPost && <span className="text-muted-foreground text-xs sm:text-sm">editing</span>}
                </div>
                {!editingPost && !isReply && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <ChevronRight strokeWidth={2.2} className="w-4 h-4 -mx-1" />
                    {isChannelComposer ? (
                      <span className="font-bold">
                        {currentCommunity?.metadata?.name || feed}
                      </span>
                    ) : (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="hover:text-foreground transition-colors">
                            {selectedChannelName || "Community"}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-h-72 overflow-auto min-w-56">
                          {isChannelsLoading && (
                            <DropdownMenuItem disabled className="text-muted-foreground">
                              Loading channels...
                            </DropdownMenuItem>
                          )}
                          {!isChannelsLoading && channels.length === 0 && (
                            <DropdownMenuItem disabled className="text-muted-foreground">
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
                              >
                                <span className="truncate">{name}</span>
                              </DropdownMenuItem>
                            );
                          })}
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

              <PostComposerActions onImageClick={open} onEmojiClick={handleEmojiClick} onDraftsClick={() => setIsDraftsOpen(true)} />
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

      {/* Drafts Modal */}
      <Dialog open={isDraftsOpen} onOpenChange={setIsDraftsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Drafts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-80 overflow-auto">
            {drafts.length === 0 && <div className="text-sm text-muted-foreground">No drafts yet</div>}
            {drafts.map((d) => (
              <div
                key={d.id}
                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => loadDraftIntoComposer(d.id)}
                >
                  <div className="text-xs text-muted-foreground">{formatDate(new Date(d.createdAt), "MMM d, yyyy")}</div>
                  <div className="truncate text-sm">{d.content.split("\n")[0] || "(empty)"}</div>
                </button>
                <button
                  type="button"
                  aria-label="Delete draft"
                  title="Delete draft"
                  className="shrink-0 p-1 rounded-full hover:bg-muted/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDraftAtom(d.id);
                    if (currentDraftId === d.id) {
                      setCurrentDraftId(undefined);
                      currentDraftCreatedAtRef.current = null;
                    }
                  }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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

const ForwardedPostComposer = forwardRef<PostComposerHandle, PostComposerProps>(function PostComposerForwarded(
  props,
  ref,
) {
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
});

export default ForwardedPostComposer;
