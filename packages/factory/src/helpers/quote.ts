import { EventPointer } from "nostr-tools/nip19";

import { fillAndTrimTag } from "./tag.js";

/** Creates a "q" tag for an EventPointer */
export function createQTagFromEventPointer(pointer: EventPointer) {
  return fillAndTrimTag(["q", pointer.id, pointer.relays?.[0], pointer.author]);
}

/** Adds or merges an EventPointer into a tags list */
export function ensureQuoteEventPointerTag(tags: string[][], pointer: EventPointer) {
  const existing = tags.find((t) => t[0] === "q" && t[1] === pointer.id);

  if (existing) {
    const merged = fillAndTrimTag(["q", pointer.id, existing[2] || pointer.relays?.[0], existing[3] || pointer.author]);

    // replace tag
    return tags.map((t) => (t === existing ? merged : t));
  }
  return [...tags, createQTagFromEventPointer(pointer)];
}
