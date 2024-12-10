import { getCoordinateFromAddressPointer } from "applesauce-core/helpers";
import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";

import { fillAndTrimTag } from "./tag.js";

/** Returns a tag for an address pointer */
export function createATagFromAddressPointer(pointer: AddressPointer): string[] {
  const coordinate = getCoordinateFromAddressPointer(pointer);
  return fillAndTrimTag(["a", coordinate, pointer.relays?.[0]]);
}

export type ETagMarker = "root" | "reply" | "mention" | "";

/** Returns a tag for an event pointer */
export function createETagFromEventPointer(pointer: EventPointer, marker?: ETagMarker): string[] {
  return fillAndTrimTag(["e", pointer.id, pointer.relays?.[0], marker, pointer.author]);
}

/** Returns a tag for an profile pointer */
export function createPTagFromProfilePointer(pointer: ProfilePointer): string[] {
  return fillAndTrimTag(["p", pointer.pubkey, pointer.relays?.[0]]);
}
