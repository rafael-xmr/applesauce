import { NostrEvent } from "nostr-tools";
import { getNip10References } from "applesauce-core/helpers";
import { EventPointer } from "nostr-tools/nip19";

import { EventFactoryOperation } from "../event-factory.js";
import { ensureMarkedEventPointerTag } from "../helpers/common-tags.js";

/** Includes NIP-10 reply tags */
export function includeNoteReplyTags(parent: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);

    const pointer: EventPointer = { id: parent.id, author: parent.pubkey, kind: parent.kind };
    if (ctx.getRelayHint) {
      const hint = await ctx.getRelayHint(parent);
      if (hint) pointer.relays = [hint];
    }

    const refs = getNip10References(parent);
    const root = refs.root?.e ?? pointer;

    const reply: EventPointer = pointer;

    tags = ensureMarkedEventPointerTag(tags, root, "root");
    tags = ensureMarkedEventPointerTag(tags, reply, "reply");

    return { ...draft, tags };
  };
}
