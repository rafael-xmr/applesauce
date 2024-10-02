import { getEventPointerFromTag, isETag } from "applesauce-core/helpers";
import { getOrComputeCachedValue } from "applesauce-core/helpers/cache";
import { NostrEvent } from "nostr-tools";

export const PinnedNotesSymbol = Symbol.for("pinned-notes");

/** Returns a set of muted threads */
export function getPinnedNotes(pin: NostrEvent) {
  return getOrComputeCachedValue(pin, PinnedNotesSymbol, (e) => e.tags.filter(isETag).map(getEventPointerFromTag));
}
