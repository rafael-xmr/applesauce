import { NostrEvent } from "nostr-tools";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import { getAddressPointerForEvent } from "applesauce-core/helpers";

import { EventOperation } from "../../event-factory.js";
import { ensureAddressPointerTag, ensureEventPointerTag, ensureKTag } from "../../helpers/common-tags.js";

/** Includes NIP-09 delete event tags */
export function includeDeleteTags(events: NostrEvent[]): EventOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);

    for (const event of events) {
      tags = ensureKTag(tags, event.kind);
      tags = ensureEventPointerTag(tags, event);

      if (isParameterizedReplaceableKind(event.kind)) {
        tags = ensureAddressPointerTag(tags, getAddressPointerForEvent(event));
      }
    }

    return { ...draft, tags };
  };
}
