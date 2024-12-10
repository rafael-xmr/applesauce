import { NostrEvent } from "nostr-tools";

import { EventFactoryOperation } from "../event-factory.js";
import { createCommentTagsForReply } from "../helpers/comment.js";
import { fillAndTrimTag } from "../helpers/tag.js";

/** Includes NIP-22 comment tags */
export function includeCommentTags(parent: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    const relayHint = ctx.getRelayHint ? await ctx.getRelayHint(parent) : undefined;
    const tags = [...draft.tags, ...createCommentTagsForReply(parent, relayHint)];

    // include notification tag for pubkey
    tags.push(fillAndTrimTag(["p", parent.pubkey, await ctx.getPubkeyRelayHint?.(parent.pubkey)]));

    return { ...draft, tags };
  };
}
