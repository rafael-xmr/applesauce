import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import {
  createATagFromAddressPointer,
  createETagFromEventPointer,
  createPTagFromProfilePointer,
  ETagMarker,
} from "./pointer.js";
import { fillAndTrimTag } from "./tag.js";
import { getCoordinateFromAddressPointer } from "applesauce-core/helpers";

/** Adds or merges an EventPointer into a tags list */
export function ensureEventPointerTag(tags: string[][], pointer: EventPointer, marker?: ETagMarker) {
  const existing = tags.find((t) => t[0] === "e" && t[1] === pointer.id && (t[3] ?? "") === (marker ?? ""));

  if (existing) {
    const merged = fillAndTrimTag([
      "e",
      pointer.id,
      existing[2] || pointer.relays?.[0],
      // markers should always be equal
      marker,
      existing[4] || pointer.author,
    ]);

    // replace tag
    return tags.map((t) => (t === existing ? merged : t));
  }
  return [...tags, createETagFromEventPointer(pointer, marker)];
}

/** Adds or merges an ProfilePointer into a tags list */
export function ensureProfilePointerTag(tags: string[][], pointer: ProfilePointer) {
  const existing = tags.find((t) => t[0] === "p" && t[1] === pointer.pubkey);

  if (existing) {
    const merged = fillAndTrimTag(["p", pointer.pubkey, existing[2] || pointer.relays?.[0]]);

    // replace tag
    return tags.map((t) => (t === existing ? merged : t));
  }
  return [...tags, createPTagFromProfilePointer(pointer)];
}

/** Adds or merges an AddressPointer into a tags list */
export function ensureAddressPointerTag(tags: string[][], pointer: AddressPointer) {
  const coordinate = getCoordinateFromAddressPointer(pointer);
  const existing = tags.find((t) => t[0] === "a" && t[1] === coordinate);

  if (existing) {
    const merged = fillAndTrimTag(["a", coordinate, existing[2] || pointer.relays?.[0]]);

    // replace tag
    return tags.map((t) => (t === existing ? merged : t));
  }
  return [...tags, createATagFromAddressPointer(pointer)];
}
