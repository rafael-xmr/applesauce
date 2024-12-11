import { NostrEvent } from "nostr-tools";

import { EventFactoryOperation } from "../event-factory.js";
import { createCommentTagsForReply } from "../helpers/comment.js";
import { ensureProfilePointerTag } from "../helpers/common-tags.js";

/** Includes NIP-22 comment tags */
export function includeCommentTags(parent: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    const relayHint = await ctx.getRelayHint?.(parent);
    let tags = [...draft.tags, ...createCommentTagsForReply(parent, relayHint)];

    // include notification tag for pubkey
    const relay = await ctx.getPubkeyRelayHint?.(parent.pubkey);
    tags = ensureProfilePointerTag(tags, { pubkey: parent.pubkey, relays: relay ? [relay] : undefined });

    return { ...draft, tags };
  };
}
