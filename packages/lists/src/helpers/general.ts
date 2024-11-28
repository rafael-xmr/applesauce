import {
  getAddressPointerFromTag,
  getCoordinateFromAddressPointer,
  getEventPointerFromTag,
  getHiddenTags,
  getProfilePointerFromTag,
  isATag,
  isETag,
  isPTag,
} from "applesauce-core/helpers";
import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import { NostrEvent } from "nostr-tools";

function listGetAllTags(list: NostrEvent): string[][] {
  const hidden = getHiddenTags(list);
  return hidden ? [...hidden, ...list.tags] : list.tags;
}

/**
 * Checks if an event pointer is anywhere in a list
 * NOTE: Ignores the `relay` field in EventPointer
 * NOTE: This will check the hidden tags if the list has hidden tags and they are unlocked
 */
export function isEventPointerInList(list: NostrEvent, pointer: string | EventPointer): boolean {
  const id = typeof pointer === "string" ? pointer : pointer.id;
  return listGetAllTags(list).some((t) => t[0] === "e" && t[1] === id);
}

/**
 * Checks if an address pointer is anywhere in a list
 * NOTE: Ignores the `relay` field in AddressPointer
 * NOTE: This will check the hidden tags if the list has hidden tags and they are unlocked
 */
export function isAddressPointerInList(list: NostrEvent, pointer: string | AddressPointer): boolean {
  const cord = typeof pointer === "string" ? pointer : getCoordinateFromAddressPointer(pointer);
  return listGetAllTags(list).some((t) => t[0] === "a" && t[1] === cord);
}

/**
 * Checks if an profile pointer is anywhere in a list
 * NOTE: Ignores the `relay` field in ProfilePointer
 * NOTE: This will check the hidden tags if the list has hidden tags and they are unlocked
 */
export function isProfilePointerInList(list: NostrEvent, pointer: string | ProfilePointer): boolean {
  const pubkey = typeof pointer === "string" ? pointer : pointer.pubkey;
  return listGetAllTags(list).some((t) => t[0] === "p" && t[1] === pubkey);
}

/** Returns all the EventPointer in a list */
export function getEventPointersFromList(list: NostrEvent): EventPointer[] {
  return listGetAllTags(list).filter(isETag).map(getEventPointerFromTag);
}

/** Returns all the AddressPointer in a list */
export function getAddressPointersFromList(list: NostrEvent): AddressPointer[] {
  return listGetAllTags(list).filter(isATag).map(getAddressPointerFromTag);
}

/** Returns all the ProfilePointer in a list */
export function getProfilePointersFromList(list: NostrEvent): ProfilePointer[] {
  return listGetAllTags(list).filter(isPTag).map(getProfilePointerFromTag);
}
