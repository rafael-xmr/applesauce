import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import { isParameterizedReplaceableKind, isReplaceableKind } from "nostr-tools/kinds";
import { NostrEvent } from "nostr-tools";

import { getHiddenTags } from "./hidden-tags.js";
import {
  getAddressPointerFromATag,
  getCoordinateFromAddressPointer,
  getEventPointerFromETag,
  getProfilePointerFromPTag,
} from "./pointers.js";
import { isATag, isETag, isPTag, processTags } from "./tags.js";
import { getReplaceableIdentifier } from "./event.js";

function listGetAllTags(list: NostrEvent): string[][] {
  const hidden = getHiddenTags(list);
  return hidden ? [...hidden, ...list.tags] : list.tags;
}

/**
 * Checks if an event pointer is anywhere in a list or set
 * NOTE: Ignores the `relay` field in EventPointer
 * NOTE: This will check the hidden tags if the list has hidden tags and they are unlocked
 */
export function isEventPointerInList(list: NostrEvent, pointer: string | EventPointer): boolean {
  const id = typeof pointer === "string" ? pointer : pointer.id;
  return listGetAllTags(list).some((t) => t[0] === "e" && t[1] === id);
}

/**
 * Checks if an address pointer is anywhere in a list or set
 * NOTE: Ignores the `relay` field in AddressPointer
 * NOTE: This will check the hidden tags if the list has hidden tags and they are unlocked
 */
export function isAddressPointerInList(list: NostrEvent, pointer: string | AddressPointer): boolean {
  const cord = typeof pointer === "string" ? pointer : getCoordinateFromAddressPointer(pointer);
  return listGetAllTags(list).some((t) => t[0] === "a" && t[1] === cord);
}

/**
 * Checks if an profile pointer is anywhere in a list or set
 * NOTE: Ignores the `relay` field in ProfilePointer
 * NOTE: This will check the hidden tags if the list has hidden tags and they are unlocked
 */
export function isProfilePointerInList(list: NostrEvent, pointer: string | ProfilePointer): boolean {
  const pubkey = typeof pointer === "string" ? pointer : pointer.pubkey;
  return listGetAllTags(list).some((t) => t[0] === "p" && t[1] === pubkey);
}

/** Returns all the EventPointer in a list or set */
export function getEventPointersFromList(list: NostrEvent): EventPointer[] {
  return processTags(listGetAllTags(list), (tag) => (isETag(tag) ? tag : undefined), getEventPointerFromETag);
}

/** Returns all the AddressPointer in a list or set */
export function getAddressPointersFromList(list: NostrEvent): AddressPointer[] {
  return processTags(listGetAllTags(list), (t) => (isATag(t) ? t : undefined), getAddressPointerFromATag);
}

/** Returns all the ProfilePointer in a list or set */
export function getProfilePointersFromList(list: NostrEvent): ProfilePointer[] {
  return processTags(listGetAllTags(list), (t) => (isPTag(t) ? t : undefined), getProfilePointerFromPTag);
}

/** Returns if an event is a valid list or set */
export function isValidList(event: NostrEvent): boolean {
  try {
    if (isParameterizedReplaceableKind(event.kind)) {
      // event is a set

      // ensure the set has an identifier
      getReplaceableIdentifier(event);

      return true;
    } else if (isReplaceableKind(event.kind) && event.kind >= 10000 && event.kind < 20000) {
      // event is a list
      return true;
    }
  } catch (error) {}

  return false;
}
