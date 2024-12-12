import { getEventPointerForEvent } from "applesauce-core/helpers";
import { EventFactoryOperation } from "applesauce-factory";
import { ensureEventPointerTag } from "applesauce-factory/helpers";
import { NostrEvent } from "nostr-tools";

/** Includes the "e" tag referencing the channel creating event */
export function includeChannelPointerTag(channel: NostrEvent): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);
    tags = ensureEventPointerTag(tags, getEventPointerForEvent(channel));
    return { ...draft, tags };
  };
}
