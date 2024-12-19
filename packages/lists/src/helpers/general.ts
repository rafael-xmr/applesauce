import {
  getAddressPointerFromATag,
  getCoordinateFromAddressPointer,
  getEventPointerFromETag,
  getHiddenTags,
  getProfilePointerFromPTag,
  getReplaceableIdentifier,
  isATag,
  isETag,
  isPTag,
} from "applesauce-core/helpers";
import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import { isParameterizedReplaceableKind, isReplaceableKind } from "nostr-tools/kinds";
import { NostrEvent } from "nostr-tools";

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
  return listGetAllTags(list).filter(isETag).map(getEventPointerFromETag);
}

/** Returns all the AddressPointer in a list or set */
export function getAddressPointersFromList(list: NostrEvent): AddressPointer[] {
  return listGetAllTags(list).filter(isATag).map(getAddressPointerFromATag);
}

/** Returns all the ProfilePointer in a list or set */
export function getProfilePointersFromList(list: NostrEvent): ProfilePointer[] {
  return listGetAllTags(list).filter(isPTag).map(getProfilePointerFromPTag);
}

/** Returns if an event is a valid list or set */
export function isValidList(list: NostrEvent): boolean {
  try {
    if (isParameterizedReplaceableKind(list.kind)) {
      // sets

      // ensure the set has an identifier
      getReplaceableIdentifier(list);

      return true;
    } else if (isReplaceableKind(list.kind) && list.kind >= 10000 && list.kind < 20000) {
      // lists
      return true;
    }
  } catch (error) {}

  return false;
}
