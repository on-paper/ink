import type { Post } from "@cartel-sh/ui";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";
import { fetchChannel } from "~/utils/ecp/channels";

export interface ECPComment {
  id: string;
  commentType?: number; // 0 = post/comment, 1 = reaction
  channelId?: string;
  author:
  | {
    address?: string;
    ens?: any;
  }
  | string;
  content: string;
  createdAt: number | string;
  reactions?: {
    upvotes?: number;
    downvotes?: number;
  };
  replies?: {
    results?: ECPComment[];
    extra?: any;
    pagination?: any;
  };
  parentId?: string;
  targetUri?: string;
  reactionCounts?: {
    like?: number;
    repost?: number;
    [key: string]: number | undefined;
  };
  viewerReactions?: {
    like?: boolean;
    repost?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface CommentToPostOptions {
  currentUserAddress?: string;
  includeReplies?: boolean;
}

export async function ecpCommentToPost(comment: ECPComment, options: CommentToPostOptions = {}): Promise<Post> {
  const { currentUserAddress, includeReplies = false } = options;
  const authorAddress = (
    typeof comment.author === "string" ? comment.author : comment.author.address || ""
  ).toLowerCase();

  const displayName = `${authorAddress.slice(0, 6)}...${authorAddress.slice(-4)}`;

  const ensUser = await fetchEnsUser(authorAddress, currentUserAddress);

  const author = ensUser || {
    id: authorAddress,
    address: authorAddress,
    username: displayName,
    namespace: "ens",
    profilePictureUrl: `https://api.dicebear.com/9.x/glass/svg?seed=${authorAddress}`,
    description: null,
    actions: {
      followed: false,
      following: false,
      blocked: false,
      muted: false,
    },
    stats: {
      following: 0,
      followers: 0,
    },
  };

  const timestamp = comment.createdAt;
  const createdAt =
    typeof timestamp === "number"
      ? new Date(timestamp * 1000) // Convert Unix timestamp to Date
      : new Date(timestamp); // Already ISO string

  let channelMeta: { id: string; name: string; slug: string } | undefined;
  if (comment.channelId && comment.channelId !== "0") {
    try {
      const channel = await fetchChannel(comment.channelId);
      if (channel?.name) {
        channelMeta = {
          id: channel.id,
          name: channel.name,
          slug: channel.name.toLowerCase().replace(/\s+/g, "-"),
        };
      }
    } catch (_e) { }
  }

  const allReplies = comment.replies?.results ?? [];
  const normalReplies = allReplies.filter((r) => (r.commentType ?? 0) === 0);
  const reactionReplies = allReplies.filter((r) => (r.commentType ?? 0) === 1);

  const likeCountFromApi = comment.reactionCounts?.like ?? 0;
  const repostCountFromApi = comment.reactionCounts?.repost ?? 0;

  const likeCountDerived = reactionReplies.filter(
    (r) => typeof r.content === "string" && r.content.toLowerCase() === "like",
  ).length;
  const repostCountDerived = reactionReplies.filter(
    (r) => typeof r.content === "string" && r.content.toLowerCase() === "repost",
  ).length;

  const likeCount = likeCountFromApi || likeCountDerived || comment.reactions?.upvotes || 0;
  const repostCount = repostCountFromApi || repostCountDerived || 0;

  const isUpvoted = Boolean(comment.viewerReactions?.like);
  const isReposted = Boolean(comment.viewerReactions?.repost);

  const post: Post = {
    id: comment.id,
    author,
    metadata: {
      content: comment.content,
      __typename: "TextOnlyMetadata" as const,
      ...(channelMeta ? { channel: channelMeta } : {}),
    },
    createdAt,
    updatedAt: createdAt,
    platform: "lens" as const,
    __typename: "Post" as const,
    isEdited: false,
    reactions: {
      Bookmark: 0,
      Collect: 0,
      Comment: normalReplies.length,
      Repost: repostCount,
      upvotes: likeCount,
      isUpvoted,
      isBookmarked: false,
      isCollected: false,
      isReposted,
      canCollect: false,
      canComment: true,
      canRepost: true,
      canQuote: true,
      canDecrypt: false,
      canEdit: currentUserAddress ? authorAddress === currentUserAddress.toLowerCase() : false,
      totalReactions: likeCount + normalReplies.length + repostCount,
    },
    comments: [],
    mentions: undefined,
  };

  // Only include non-reaction replies as comments
  if (includeReplies && normalReplies.length > 0) {
    post.comments = await Promise.all(
      normalReplies.map((reply) => ecpCommentToPost(reply, { currentUserAddress, includeReplies: false })),
    );
  }

  return post;
}
