import { NostrEvent } from "nostr-tools";
import { getNip10References, isPTag } from "applesauce-core/helpers";
import { EventPointer } from "nostr-tools/nip19";

import { EventFactoryOperation } from "../event-factory.js";
import { ensureMarkedEventPointerTag, ensureProfilePointerTag } from "../helpers/common-tags.js";

/** Includes NIP-10 reply tags */
export function includeNoteThreadingTags(parent: NostrEvent): EventFactoryOperation {
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

/** Copies "p" tags from parent event and adds new pubkey */
export function includeNoteThreadingNotifyTags(parent: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);

    // copy "p" tags from parent event
    for (const tag of parent.tags) {
      if (isPTag(tag)) tags.push(tag);
    }

    // add new "p" tag
    const hint = await ctx.getPubkeyRelayHint?.(parent.pubkey);
    tags = ensureProfilePointerTag(tags, { pubkey: parent.pubkey, relays: hint ? [hint] : undefined });

    return { ...draft, tags };
  };
}
