import { nip19 } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";

import { isHexKey } from "./string.js";
import { getPubkeyFromDecodeResult } from "./pointers.js";
import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import { mergeRelaySets } from "./relays.js";

/** Gets the hex pubkey from any nip-19 encoded string */
export function normalizeToPubkey(str: string): string {
  if (isHexKey(str)) return str;
  else {
    const decode = nip19.decode(str);
    const pubkey = getPubkeyFromDecodeResult(decode);
    if (!pubkey) throw new Error(`Cant find pubkey in ${decode.type}`);
    return pubkey;
  }
}

/** Converts hex to nsec strings into Uint8 secret keys */
export function normalizeToSecretKey(str: string): Uint8Array {
  if (isHexKey(str)) return hexToBytes(str);
  else {
    const decode = nip19.decode(str);
    if (decode.type !== "nsec") throw new Error(`Cant get secret key from ${decode.type}`);
    return decode.data;
  }
}

/**
 * Merges two event points and keeps all relays
 * @throws if the ids are different
 */
export function mergeEventPointers(a: EventPointer, b: EventPointer): EventPointer {
  if (a.id !== b.id) throw new Error("Cant merge event pointers with different ids");

  const relays = mergeRelaySets(a.relays, b.relays);
  return { id: a.id, kind: a.kind ?? b.kind, author: a.author ?? b.author, relays };
}

/** Merges two address pointers and keeps all relays
 * @throws if the kinds, pubkeys, or identifiers are different
 */
export function mergeAddressPointers(a: AddressPointer, b: AddressPointer): AddressPointer {
  if (a.kind !== b.kind || a.pubkey !== b.pubkey || a.identifier !== b.identifier)
    throw new Error("Cant merge address pointers with different kinds, pubkeys, or identifiers");

  const relays = mergeRelaySets(a.relays, b.relays);
  return { ...a, relays };
}

/** Merges two profile pointers and keeps all relays
 * @throws if the pubkeys are different
 */
export function mergeProfilePointers(a: ProfilePointer, b: ProfilePointer): ProfilePointer {
  if (a.pubkey !== b.pubkey) throw new Error("Cant merge profile pointers with different pubkeys");

  const relays = mergeRelaySets(a.relays, b.relays);
  return { ...a, relays };
}
