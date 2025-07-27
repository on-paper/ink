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
import { SendHorizontalIcon, VideoIcon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/src/components/ui/form";
import { useUser } from "~/components/user/UserContext";
import { MAX_CONTENT_LENGTH, usePostSubmission } from "~/hooks/usePostSubmission";
import { storageClient } from "~/utils/lens/storage";
import {
  castToMediaImageType,
  castToMediaVideoType,
  normalizeImageMimeType,
  normalizeVideoMimeType,
} from "~/utils/mimeTypes";
import { LexicalEditorWrapper } from "../composer/LexicalEditor";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "../ui/button";
import { UserAvatar } from "../user/UserAvatar";
import { ComposerProvider, useComposer } from "./ComposerContext";
import { PostComposerActions } from "./PostComposerActions";
import { QuotedPostPreview } from "./QuotedPostPreview";

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
}

function ComposerContent() {
  const { user: contextUser, requireAuth } = useUser();
  const { isPosting, submitPost } = usePostSubmission();
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
  } = useComposer();

  const currentUser = user || contextUser;
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);

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

    await submitPost({
      content: data.content,
      mediaFiles,
      processMediaForSubmission,
      editingPost,
      replyingTo,
      quotedPost,
      currentUser,
      community: finalCommunity,
      feed,
      onSuccess: (post) => {
        onSuccess?.(post);
        if (replyingTo || quotedPost) {
          onCancel?.();
        }
      },
      onClose: onCancel,
      clearForm: () => {
        form.setValue("content", "");
        setMediaFiles([]);
      },
    });
  }

  const handleEmojiClick = useCallback(
    (emoji: any) => {
      if (!requireAuth()) return;
      const content = form.getValues("content");
      form.setValue("content", content + emoji.emoji, { shouldValidate: true });
    },
    [form, requireAuth],
  );

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
    <div className="w-full" {...getRootProps()} onClick={(e) => e.stopPropagation()}>
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
              <div className="flex h-5 justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm">{currentUser?.username}</span>
                  {editingPost && <span className="text-muted-foreground text-xs sm:text-sm">editing</span>}
                </div>
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
                          }}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                              onSubmit(form.getValues());
                            }
                          }}
                          onPasteFiles={handleAddFiles}
                          placeholder={placeholderText}
                          disabled={isPosting}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <PostComposerActions onImageClick={open} onEmojiClick={handleEmojiClick} />
              <MediaPreview files={mediaFiles} onRemove={removeMedia} onReorder={reorderMedia} />
              {quotedPost && <QuotedPostPreview quotedPost={quotedPost} />}

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
    </div>
  );
}

export default function PostComposer({
  user,
  replyingTo,
  quotedPost,
  editingPost,
  initialContent = "",
  community,
  feed,
  onSuccess,
  onCancel,
  isReplyingToComment = false,
}: PostComposerProps) {
  const contextValue = {
    user,
    replyingTo,
    quotedPost,
    editingPost,
    initialContent,
    community,
    feed,
    isReplyingToComment,
    onSuccess,
    onCancel,
  };

  return (
    <ComposerProvider value={contextValue}>
      <ComposerContent />
    </ComposerProvider>
  );
}
