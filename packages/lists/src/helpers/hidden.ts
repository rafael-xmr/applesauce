import { unixNow } from "applesauce-core/helpers";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { TagOperation } from "./list.js";
import { EventStore } from "applesauce-core";

export const HiddenTagsSymbol = Symbol.for("hidden-tags");

declare module "nostr-tools" {
  export interface Event {
    [HiddenTagsSymbol]?: string[][];
  }
}

export function hasHiddenTags(list: NostrEvent) {
  return !!list.content;
}

export function getHiddenTags(list: NostrEvent) {
  if (list[HiddenTagsSymbol] instanceof Error) return undefined;
  return list[HiddenTagsSymbol];
}

export function isHiddenTagsLocked(list: NostrEvent) {
  return hasHiddenTags(list) && getHiddenTags(list) === undefined;
}

/** Returns if the private part of a list has been modified */
export function isHiddenTagsModified(list: NostrEvent) {
  const hidden = getHiddenTags(list);
  if (!hidden) return false;

  return JSON.stringify(list.tags) !== JSON.stringify(hidden);
}

/**
 * Decrypts the private list
 * @param list The list event to decrypt
 * @param store An optional EventStore to notify about the update
 */
export async function unlockHiddenTags(
  list: NostrEvent,
  decrypt: (content: string) => string,
  store?: EventStore,
): Promise<NostrEvent> {
  const plaintext = await decrypt(list.content);
  const parsed = JSON.parse(plaintext) as string[][];
  if (!Array.isArray(parsed)) throw new Error("Content is not an array of tags");

  // Convert array to tags array string[][]
  const tags = parsed.filter((t) => Array.isArray(t)).map((t) => t.map((v) => String(v)));

  list[HiddenTagsSymbol] = tags;

  if (store) store.update(list);

  return list;
}

/** Saves the private list to the contents */
export async function saveHiddenTags(list: NostrEvent, encrypt: (content: string) => string): Promise<EventTemplate> {
  const hidden = getHiddenTags(list);
  if (!hidden) throw new Error("List is not unlocked");

  const ciphertext = await encrypt(JSON.stringify(hidden));

  return {
    kind: list.kind,
    content: ciphertext,
    created_at: unixNow(),
    tags: list.tags,
  };
}

/** Modifies the hidden tags but DOES NOT save the list */
export function modifyHiddenTags(list: NostrEvent, operation: TagOperation) {
  if (hasHiddenTags(list)) {
    const privateList = getHiddenTags(list);
    if (!privateList) throw new Error("List is not unlocked");

    return (list[HiddenTagsSymbol] = operation(privateList));
  } else {
    return (list[HiddenTagsSymbol] = operation([]));
  }
}

/** Modifies the hidden tags and returns a new event template */
export async function modifyHiddenTagsAndSave(
  list: NostrEvent,
  operation: TagOperation,
  encrypt: (content: string) => string,
) {
  modifyHiddenTags(list, operation);
  return await saveHiddenTags(list, encrypt);
}
