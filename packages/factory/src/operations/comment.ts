import { NostrEvent } from "nostr-tools";

import { EventFactoryOperation } from "../event-factory.js";
import { createCommentTagsForReply } from "../helpers/comment.js";

export function includeCommentTags(parent: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    const relayHint = ctx.getRelayHint ? await ctx.getRelayHint(parent) : undefined;
    return { ...draft, tags: [...draft.tags, ...createCommentTagsForReply(parent, relayHint)] };
  };
}
