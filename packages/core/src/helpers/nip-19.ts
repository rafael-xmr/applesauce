import { nip19 } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";

import { isHexKey } from "./string.js";
import { getPubkeyFromDecodeResult } from "./pointers.js";

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
