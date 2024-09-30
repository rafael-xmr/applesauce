import {
  AddressPointer,
  DecodeResult,
  EventPointer,
  naddrEncode,
  neventEncode,
  noteEncode,
  nprofileEncode,
  npubEncode,
  nrelayEncode,
  nsecEncode,
  ProfilePointer,
} from "nostr-tools/nip19";
import { getPublicKey } from "nostr-tools";

import { safeRelayUrls } from "./relays.js";

export type AddressPointerWithoutD = Omit<AddressPointer, "identifier"> & {
  identifier?: string;
};

export function parseCoordinate(a: string): AddressPointerWithoutD | null;
export function parseCoordinate(a: string, requireD: false): AddressPointerWithoutD | null;
export function parseCoordinate(a: string, requireD: true): AddressPointer | null;
export function parseCoordinate(a: string, requireD: false, silent: false): AddressPointerWithoutD;
export function parseCoordinate(a: string, requireD: true, silent: false): AddressPointer;
export function parseCoordinate(a: string, requireD: true, silent: true): AddressPointer | null;
export function parseCoordinate(a: string, requireD: false, silent: true): AddressPointerWithoutD | null;
export function parseCoordinate(a: string, requireD = false, silent = true): AddressPointerWithoutD | null {
  const parts = a.split(":") as (string | undefined)[];
  const kind = parts[0] && parseInt(parts[0]);
  const pubkey = parts[1];
  const d = parts[2];

  if (!kind) {
    if (silent) return null;
    else throw new Error("Missing kind");
  }
  if (!pubkey) {
    if (silent) return null;
    else throw new Error("Missing pubkey");
  }
  if (requireD && d === undefined) {
    if (silent) return null;
    else throw new Error("Missing identifier");
  }

  return {
    kind,
    pubkey,
    identifier: d,
  };
}

export function getPubkeyFromDecodeResult(result?: DecodeResult) {
  if (!result) return;
  switch (result.type) {
    case "naddr":
    case "nprofile":
      return result.data.pubkey;
    case "npub":
      return result.data;
    case "nsec":
      return getPublicKey(result.data);
    default:
      return undefined;
  }
}

export function encodeDecodeResult(result: DecodeResult) {
  switch (result.type) {
    case "naddr":
      return naddrEncode(result.data);
    case "nprofile":
      return nprofileEncode(result.data);
    case "nevent":
      return neventEncode(result.data);
    case "nrelay":
      return nrelayEncode(result.data);
    case "nsec":
      return nsecEncode(result.data);
    case "npub":
      return npubEncode(result.data);
    case "note":
      return noteEncode(result.data);
  }

  return "";
}

export function getEventPointerFromTag(tag: string[]): EventPointer {
  if (!tag[1]) throw new Error("Missing event id in tag");
  let pointer: EventPointer = { id: tag[1] };
  if (tag[2]) pointer.relays = safeRelayUrls([tag[2]]);
  return pointer;
}
export function getAddressPointerFromTag(tag: string[]): AddressPointer {
  if (!tag[1]) throw new Error("Missing coordinate in tag");
  const pointer = parseCoordinate(tag[1], true, false);
  if (tag[2]) pointer.relays = safeRelayUrls([tag[2]]);
  return pointer;
}
export function getProfilePointerFromTag(tag: string[]): ProfilePointer {
  if (!tag[1]) throw new Error("Missing pubkey in tag");
  const pointer: ProfilePointer = { pubkey: tag[1] };
  if (tag[2]) pointer.relays = safeRelayUrls([tag[2]]);
  return pointer;
}

export function getPointerFromTag(tag: string[]): DecodeResult | null {
  try {
    switch (tag[0]) {
      case "e":
        return { type: "nevent", data: getEventPointerFromTag(tag) };

      case "a":
        return {
          type: "naddr",
          data: getAddressPointerFromTag(tag),
        };

      case "p":
        return { type: "nprofile", data: getProfilePointerFromTag(tag) };
    }
  } catch (error) {}

  return null;
}

export function isAddressPointer(pointer: DecodeResult["data"]): pointer is AddressPointer {
  return (
    typeof pointer !== "string" &&
    Object.hasOwn(pointer, "identifier") &&
    Object.hasOwn(pointer, "pubkey") &&
    Object.hasOwn(pointer, "kind")
  );
}
export function isEventPointer(pointer: DecodeResult["data"]): pointer is EventPointer {
  return typeof pointer !== "string" && Object.hasOwn(pointer, "id");
}

export function getCoordinateFromAddressPointer(pointer: AddressPointer) {
  return `${pointer.kind}:${pointer.pubkey}:${pointer.identifier}`;
}

export function getATagFromAddressPointer(pointer: AddressPointer): ["a", ...string[]] {
  const relay = pointer.relays?.[0];
  const coordinate = getCoordinateFromAddressPointer(pointer);
  return relay ? ["a", coordinate, relay] : ["a", coordinate];
}
export function getETagFromEventPointer(pointer: EventPointer): ["e", ...string[]] {
  return pointer.relays?.length ? ["e", pointer.id, pointer.relays[0]] : ["e", pointer.id];
}
