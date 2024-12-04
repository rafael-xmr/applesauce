import {
  AddressPointer,
  DecodeResult,
  EventPointer,
  naddrEncode,
  neventEncode,
  noteEncode,
  nprofileEncode,
  npubEncode,
  nsecEncode,
  ProfilePointer,
} from "nostr-tools/nip19";
import { getPublicKey, kinds, NostrEvent } from "nostr-tools";

import { safeRelayUrls } from "./relays.js";
import { getTagValue } from "./index.js";

export type AddressPointerWithoutD = Omit<AddressPointer, "identifier"> & {
  identifier?: string;
};

/** Parse the value of an "a" tag into an AddressPointer */
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

/** Extra a pubkey from the result of nip19.decode */
export function getPubkeyFromDecodeResult(result?: DecodeResult): string | undefined {
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

/** Encodes the result of nip19.decode */
export function encodeDecodeResult(result: DecodeResult) {
  switch (result.type) {
    case "naddr":
      return naddrEncode(result.data);
    case "nprofile":
      return nprofileEncode(result.data);
    case "nevent":
      return neventEncode(result.data);
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

  // get author from NIP-18 quote tags
  if (tag[0] === "q" && tag[3] && tag[3].length === 64) pointer.author = tag[3];

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

/** Parses a tag into a pointer */
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

      // NIP-18 quote tags
      case "q":
        return { type: "nevent", data: getEventPointerFromTag(tag) };
    }
  } catch (error) {}

  return null;
}

export function isEvent(event: any): event is NostrEvent {
  if (event === undefined || event === null) return false;

  return (
    event.id?.length === 64 &&
    typeof event.sig === "string" &&
    typeof event.pubkey === "string" &&
    event.pubkey.length === 64 &&
    typeof event.content === "string" &&
    Array.isArray(event.tags) &&
    typeof event.created_at === "number" &&
    event.created_at > 0
  );
}
export function isAddressPointer(pointer: DecodeResult["data"]): pointer is AddressPointer {
  return (
    typeof pointer !== "string" &&
    Reflect.has(pointer, "identifier") &&
    Reflect.has(pointer, "pubkey") &&
    Reflect.has(pointer, "kind")
  );
}
export function isEventPointer(pointer: DecodeResult["data"]): pointer is EventPointer {
  return typeof pointer !== "string" && Reflect.has(pointer, "id");
}

export function getCoordinateFromAddressPointer(pointer: AddressPointer) {
  return `${pointer.kind}:${pointer.pubkey}:${pointer.identifier}`;
}

/** Returns a tag for an address pointer */
export function getATagFromAddressPointer(pointer: AddressPointer): ["a", ...string[]] {
  const relay = pointer.relays?.[0];
  const coordinate = getCoordinateFromAddressPointer(pointer);
  return relay ? ["a", coordinate, relay] : ["a", coordinate];
}

/** Returns a tag for an event pointer */
export function getETagFromEventPointer(pointer: EventPointer): ["e", ...string[]] {
  return pointer.relays?.length ? ["e", pointer.id, pointer.relays[0]] : ["e", pointer.id];
}

/** Returns a pointer for a given event */
export function getPointerForEvent(event: NostrEvent, relays?: string[]): DecodeResult {
  if (kinds.isParameterizedReplaceableKind(event.kind)) {
    const d = getTagValue(event, "d");
    if (!d) throw new Error("Event missing identifier");

    return {
      type: "naddr",
      data: {
        identifier: d,
        kind: event.kind,
        pubkey: event.pubkey,
        relays,
      },
    };
  } else {
    return {
      type: "nevent",
      data: {
        id: event.id,
        kind: event.kind,
        author: event.pubkey,
        relays,
      },
    };
  }
}
