import { NostrEvent } from "nostr-tools";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import { Emoji, getTagValue } from "applesauce-core/helpers";

import { EventFactoryOperation } from "../event-factory.js";
import {
  ensureAddressPointerTag,
  ensureEventPointerTag,
  ensureKTag,
  ensureProfilePointerTag,
} from "../helpers/common-tags.js";

/** Sets the content for a reaction event */
export function setReactionContent(emoji: string | Emoji = "+"): EventFactoryOperation {
  return (draft) => ({ ...draft, content: typeof emoji === "string" ? emoji : `:${emoji.shortcode}:` });
}

/** Includes NIP-25 "e", "p", "k", and "a" tags for a reaction event */
export function includeReactionTags(event: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);

    const eventHint = await ctx?.getEventRelayHint?.(event.id);
    const pubkeyHint = await ctx?.getPubkeyRelayHint?.(event.pubkey);

    // include "e" tag
    tags = ensureEventPointerTag(tags, {
      id: event.id,
      relays: eventHint ? [eventHint] : undefined,
    });

    // include "p" tag
    tags = ensureProfilePointerTag(tags, {
      pubkey: event.pubkey,
      relays: pubkeyHint ? [pubkeyHint] : undefined,
    });

    if (isParameterizedReplaceableKind(event.kind)) {
      // include "a" tag
      const identifier = getTagValue(event, "d");
      if (identifier)
        tags = ensureAddressPointerTag(tags, {
          kind: event.kind,
          pubkey: event.pubkey,
          identifier,
          relays: eventHint ? [eventHint] : undefined,
        });
    }

    // include "k" tag
    tags = ensureKTag(tags, event.kind);

    return { ...draft, tags };
  };
}
