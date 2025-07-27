import type { Notification, User } from "@cartel-sh/ui";
import type { Notification as LensNotification } from "@lens-protocol/client";
import { lensItemToPost } from "./postConverter";
import { lensAccountToUser } from "./userConverter";

export function lensNotificationToNative(item: LensNotification): Notification {
  const base = { id: (item as any).id || crypto.randomUUID() };

  switch (item.__typename) {
    case "CommentNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.comment.author)],
        actedOn: lensItemToPost(item.comment) || undefined,
        createdAt: new Date(item.comment.timestamp),
        type: "Comment",
        __typename: "Notification",
      };

    case "ReactionNotification": {
      const reaction = item.reactions[0]?.reactions[0];
      return {
        ...base,
        who: item.reactions.map((r) => lensAccountToUser(r.account)),
        actedOn: item.post ? lensItemToPost(item.post) || undefined : undefined,
        createdAt: new Date(reaction?.reactedAt ?? Date.now()),
        type: "Reaction",
        reactionType: reaction?.reaction === "UPVOTE" ? "Upvote" : "Downvote",
        __typename: "Notification",
      };
    }

    case "PostActionExecutedNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.post.author)],
        actedOn: lensItemToPost(item.post) || undefined,
        createdAt: new Date(item.post.timestamp),
        type: "Action",
        actionType: "PostAction",
        __typename: "Notification",
      };

    case "AccountActionExecutedNotification": {
      const action = item.actions[0];

      if (!action) {
        return {
          ...base,
          who: [],
          createdAt: new Date(),
          type: "Action",
          __typename: "Notification",
        };
      }

      let who: User[] = [];
      let createdAt = new Date();
      let actionType = "Unknown";

      const actionAny = action as any;
      const itemAny = item as any;

      switch (actionAny.__typename) {
        case "TippingAccountActionExecuted":
          // The account is in executedBy property
          if (actionAny.executedBy) {
            who = [lensAccountToUser(actionAny.executedBy)];
          }
          createdAt = new Date(actionAny.executedAt || Date.now());
          actionType = "Tipping";
          break;

        case "UnknownAccountActionExecuted":
          // Check for executedBy first, then other possible properties
          if (actionAny.executedBy) {
            who = [lensAccountToUser(actionAny.executedBy)];
          } else if (actionAny.account) {
            who = [lensAccountToUser(actionAny.account)];
          }
          createdAt = new Date(actionAny.executedAt || Date.now());
          actionType = "Unknown";
          break;

        default:
          // Check for executedBy first, then other possible properties
          if (actionAny.executedBy) {
            who = [lensAccountToUser(actionAny.executedBy)];
          } else if (actionAny.account) {
            who = [lensAccountToUser(actionAny.account)];
          }
          if (actionAny.executedAt) {
            createdAt = new Date(actionAny.executedAt);
          }
          actionType =
            typeof actionAny.__typename === "string"
              ? actionAny.__typename.replace("AccountActionExecuted", "")
              : "Unknown";
          break;
      }

      return {
        ...base,
        who,
        createdAt,
        type: "Action",
        actionType,
        __typename: "Notification",
      };
    }

    case "FollowNotification":
      return {
        ...base,
        who: item.followers.map((f) => lensAccountToUser(f.account)),
        createdAt: new Date(item.followers[0]?.followedAt ?? Date.now()),
        type: "Follow",
        __typename: "Notification",
      };

    case "MentionNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.post.author)],
        actedOn: item.post ? lensItemToPost(item.post) || undefined : undefined,
        createdAt: new Date(item.post.timestamp),
        type: "Mention",
        __typename: "Notification",
      };

    case "RepostNotification":
      return {
        ...base,
        who: item.reposts.map((r) => lensAccountToUser(r.account)),
        actedOn: item.post ? lensItemToPost(item.post) || undefined : undefined,
        createdAt: new Date(item.post.timestamp),
        type: "Repost",
        __typename: "Notification",
      };

    case "QuoteNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.quote.author)],
        actedOn: item.quote ? lensItemToPost(item.quote) || undefined : undefined,
        createdAt: new Date(item.quote.timestamp),
        type: "Quote",
        __typename: "Notification",
      };

    default:
      console.log("Unknown notification type, falling back to Action:", {
        typename: item.__typename,
        item: item,
      });

      return {
        ...base,
        who: [],
        createdAt: new Date(),
        type: "Action",
        actionType: typeof item.__typename === "string" ? item.__typename : "Unknown",
        __typename: "Notification",
      };
  }
}
