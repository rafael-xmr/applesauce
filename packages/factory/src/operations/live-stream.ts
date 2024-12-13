import { NostrEvent } from "nostr-tools";
import { getAddressPointerForEvent } from "applesauce-core/helpers";

import { EventFactoryOperation } from "../event-factory.js";
import { ensureMarkedAddressPointerTag } from "../helpers/common-tags.js";

/** Includes the "a" tag for live streams */
export function includeLiveStreamTag(stream: NostrEvent): EventFactoryOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);
    const hint = await ctx.getRelayHint?.(stream);
    tags = ensureMarkedAddressPointerTag(tags, getAddressPointerForEvent(stream, hint ? [hint] : undefined), "root");
    return { ...draft, tags };
  };
}
