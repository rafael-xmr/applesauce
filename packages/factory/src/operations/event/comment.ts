import { NostrEvent } from "nostr-tools";

import { EventOperation } from "../../event-factory.js";
import { createCommentTagsForEvent } from "../../helpers/comment.js";

/** Includes NIP-22 comment tags */
export function includeCommentTags(parent: NostrEvent): EventOperation {
  return async (draft, ctx) => {
    const relayHint = await ctx.getEventRelayHint?.(parent.id);
    let tags = Array.from(draft.tags);

    // add NIP-22 comment tags
    tags.push(...createCommentTagsForEvent(parent, relayHint));

    return { ...draft, tags };
  };
}
