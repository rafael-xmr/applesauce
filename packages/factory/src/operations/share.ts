import { kinds, NostrEvent } from "nostr-tools";
import { getAddressPointerForEvent, getEventPointerForEvent } from "applesauce-core/helpers";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";

import { EventFactoryOperation } from "../event-factory.js";
import {
  ensureAddressPointerTag,
  ensureEventPointerTag,
  ensureKTag,
  ensureProfilePointerTag,
} from "../helpers/common-tags.js";

/** Includes NIP-18 repost tags */
export function includeShareTags(event: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);

    const hint = await ctx.getEventRelayHint?.(event.id);

    // add "e" tag
    tags = ensureEventPointerTag(tags, getEventPointerForEvent(event, hint ? [hint] : undefined));

    // add "a" tag
    if (isParameterizedReplaceableKind(event.kind)) {
      tags = ensureAddressPointerTag(tags, getAddressPointerForEvent(event, hint ? [hint] : undefined));
    }

    // add "p" tag for notify
    const pubkeyHint = await ctx.getPubkeyRelayHint?.(event.pubkey);
    tags = ensureProfilePointerTag(tags, { pubkey: event.pubkey, relays: pubkeyHint ? [pubkeyHint] : undefined });

    // add "k" tag
    tags = ensureKTag(tags, event.kind);

    return { ...draft, tags };
  };
}

/** Sets the NIP-18 repost kind */
export function setShareKind(event: NostrEvent): EventFactoryOperation {
  return (draft) => {
    return { ...draft, kind: event.kind === kinds.ShortTextNote ? kinds.Repost : kinds.GenericRepost };
  };
}

/** Sets the content of the event to a JSON string of the shared event */
export function setShareContent(event: NostrEvent): EventFactoryOperation {
  return (draft) => {
    return { ...draft, content: JSON.stringify(event) };
  };
}
