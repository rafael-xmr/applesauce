import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import { getCoordinateFromAddressPointer, TagOperation } from "applesauce-core/helpers";

import { createETagFromEventPointer, createATagFromAddressPointer } from "applesauce-factory/helpers/pointer";

export function addPubkeyTag(pubkey: string | ProfilePointer): TagOperation {
  pubkey = typeof pubkey !== "string" ? pubkey.pubkey : pubkey;
  return (tags) => [...tags, ["p", pubkey]];
}
export function removePubkeyTag(pubkey: string | ProfilePointer): TagOperation {
  pubkey = typeof pubkey !== "string" ? pubkey.pubkey : pubkey;
  return (tags) => tags.filter((t) => !(t[0] === "p" && t[1] === pubkey));
}

export function addEventTag(id: string | EventPointer): TagOperation {
  if (typeof id === "string") return (tags) => [...tags, ["e", id]];
  else return (tags) => [...tags, createETagFromEventPointer(id)];
}
export function removeEvent(id: string | EventPointer): TagOperation {
  if (typeof id === "string") return (tags) => tags.filter((t) => !(t[0] === "e" && t[1] === id));
  else return (tags) => tags.filter((t) => !(t[0] === "e" && t[1] === id.id));
}

export function addCoordinateTag(cord: string | AddressPointer): TagOperation {
  if (typeof cord === "string") return (tags) => [...tags, ["a", cord]];
  else return (tags) => [...tags, createATagFromAddressPointer(cord)];
}
export function removeCoordinateTag(cord: string | AddressPointer): TagOperation {
  cord = typeof cord !== "string" ? getCoordinateFromAddressPointer(cord) : cord;

  return (tags) => tags.filter((t) => !(t[0] === "a" && t[1] === cord));
}
