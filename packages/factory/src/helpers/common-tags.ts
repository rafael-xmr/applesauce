import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import {
  createATagFromAddressPointer,
  createETagFromEventPointer,
  createETagWithMarkerFromEventPointer,
  createPTagFromProfilePointer,
  ETagMarker,
} from "./pointer.js";
import { fillAndTrimTag } from "./tag.js";
import { getCoordinateFromAddressPointer } from "applesauce-core/helpers";

/** Adds or merges an EventPointer with marker into a tags list */
export function ensureMarkedEventPointerTag(tags: string[][], pointer: EventPointer, marker?: ETagMarker) {
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
  return [...tags, createETagWithMarkerFromEventPointer(pointer, marker)];
}

/**
 * Adds or merges an EventPointer without marker or pubkey into a tags list
 * NOTE: this should not be used for kind 1 notes
 */
export function ensureEventPointerTag(tags: string[][], pointer: EventPointer) {
  const existing = tags.find((t) => t[0] === "e" && t[1] === pointer.id);

  if (existing) {
    const merged = fillAndTrimTag(["e", pointer.id, existing[2] || pointer.relays?.[0]]);
    return tags.map((t) => (t === existing ? merged : t));
  }
  return [...tags, createETagFromEventPointer(pointer)];
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

/** Ensures an array of tags includes a simple "k" tag */
export function ensureKTag(tags: string[][], kind: number) {
  const existing = tags.find((t) => t[0] === "k" && t[1] === String(kind));
  if (!existing) return [...tags, ["k", String(kind)]];
  return tags;
}
