import type { Post, PostMention, PostReactions } from "@cartel-sh/ui";
import type { AnyPost, Post as LensPost, TimelineItem } from "@lens-protocol/client";
import { lensAccountToUser } from "./userConverter";

export function lensItemToPost(item: AnyPost | TimelineItem): Post | null {
  if (!item) return null;

  if (item.__typename === "Repost") {
    const repostItem = item as any;
    const originalPost = lensItemToPost(repostItem.repostOf);
    if (!originalPost) return null;

    return {
      ...originalPost,
      isRepost: true,
      repostedBy: lensAccountToUser(repostItem.author),
      repostedAt: new Date(repostItem.timestamp),
    };
  }

  if (item.__typename === "TimelineItem") {
    return lensItemToPost(item.primary);
  }

  let post: Post;
  try {
    const author = item.author;
    const timestamp = item.timestamp;

    post = {
      id: item.slug ?? item.id,
      author: lensAccountToUser(author),
      reactions: getReactions(item),
      comments: getCommentsFromItem(item),
      reply: getReplyFromItem(item),
      commentOn: getCommentOnFromItem(item),
      quoteOn: getQuoteOnFromItem(item),
      metadata: item.metadata,
      mentions: getMentionsFromItem(item),
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
      isEdited: item.isEdited || false,
      platform: "lens",
      __typename: "Post",
    };
  } catch (error) {
    console.error(error);
    return null;
  }

  return post;
}

function getReactions(post: LensPost): Partial<PostReactions> {
  return {
    Bookmark: post.stats?.bookmarks || 0,
    Collect: post.stats?.collects || 0,
    Comment: post.stats?.comments || 0,
    Repost: post.stats?.reposts || 0,
    upvotes: post.stats?.upvotes || 0,
    isUpvoted: post.operations?.hasUpvoted || false,
    isBookmarked: post.operations?.hasBookmarked || false,
    isCollected: post.operations?.hasSimpleCollected || false,
    isReposted: post.operations?.hasReposted
      ? typeof post.operations.hasReposted === "boolean"
        ? post.operations.hasReposted
        : post.operations.hasReposted.optimistic || post.operations.hasReposted.onChain
      : false,
    canCollect: post.operations?.canSimpleCollect.__typename === "SimpleCollectValidationPassed" || false,
    canComment: post.operations?.canComment.__typename === "PostOperationValidationPassed" || false,
    canRepost: post.operations?.canRepost.__typename === "PostOperationValidationPassed" || false,
    canQuote: post.operations?.canQuote.__typename === "PostOperationValidationPassed" || false,
    canDecrypt: false,
    canEdit: post.operations?.canEdit.__typename === "PostOperationValidationPassed" || false,
    totalReactions:
      post.stats?.upvotes + post.stats?.bookmarks + post.stats?.collects + post.stats?.comments + post.stats?.reposts ||
      0,
  };
}

function getCommentsFromItem(post: any) {
  const comments = [];

  if (post.__typename === "TimelineItem" && post.comments) {
    return post.comments.map(processComment);
  }

  if (post.__typename === "FeedItem" && post.comments) {
    return post.comments.filter((comment: any) => comment.commentOn?.id === post.root?.id).map(processComment);
  }

  return comments;
}

function processComment(comment: any) {
  return {
    id: comment.slug ?? comment.id,
    author: comment.by ? lensAccountToUser(comment.by) : null,
    createdAt: new Date(comment.createdAt),
    updatedAt: new Date(comment.createdAt),
    comments: [],
    reactions: getReactions(comment),
    metadata: comment.metadata,
    isEdited: comment.isEdited || false,
    platform: "lens",
    __typename: "Post" as const,
  };
}

function getCommentOnFromItem(origin: LensPost) {
  if (!origin) return undefined;
  if (origin.__typename === "Post" && (origin as any).commentOn) {
    return lensItemToPost((origin as any).commentOn);
  }
  return undefined;
}

function getQuoteOnFromItem(origin: LensPost) {
  if (!origin) return undefined;
  if (origin.__typename === "Post" && origin.quoteOf) {
    return lensItemToPost(origin.quoteOf);
  }
  return undefined;
}

function getReplyFromItem(origin: LensPost) {
  if (!origin) return undefined;

  const commentOn = getCommentOnFromItem(origin);
  if (commentOn) return commentOn;

  const quoteOn = getQuoteOnFromItem(origin);
  if (quoteOn) return quoteOn;

  return undefined;
}

function getMentionsFromItem(post: any): PostMention[] | undefined {
  if (!post.mentions || !Array.isArray(post.mentions)) return undefined;

  return post.mentions
    .map((mention: any) => {
      if (mention.__typename === "AccountMention") {
        return {
          __typename: "AccountMention",
          account: mention.account,
          namespace: mention.namespace,
          localName: mention.localName,
          replace: mention.replace,
        };
      }
      if (mention.__typename === "GroupMention") {
        return {
          __typename: "GroupMention",
          group: mention.group,
        };
      }
      return null;
    })
    .filter(Boolean);
}
