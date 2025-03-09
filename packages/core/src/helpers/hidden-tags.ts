import { EventTemplate, NostrEvent } from "nostr-tools";

import { EventStore } from "../event-store/event-store.js";
import { unixNow } from "./time.js";
import { isEvent } from "./event.js";
import {
  canHaveHiddenContent,
  getHiddenContentEncryptionMethods,
  HiddenContentSigner,
  unlockHiddenContent,
} from "./hidden-content.js";

export const HiddenTagsSymbol = Symbol.for("hidden-tags");

/** Checks if an event can have hidden tags */
export function canHaveHiddenTags(kind: number): boolean {
  return canHaveHiddenContent(kind);
}

/** Checks if an event has hidden tags */
export function hasHiddenTags(event: NostrEvent | EventTemplate): boolean {
  return canHaveHiddenTags(event.kind) && event.content.length > 0;
}

/** Returns the hidden tags for an event if they are unlocked */
export function getHiddenTags(event: NostrEvent | EventTemplate): string[][] | undefined {
  return Reflect.get(event, HiddenTagsSymbol) as string[][] | undefined;
}

/** Checks if the hidden tags are locked */
export function isHiddenTagsLocked(event: NostrEvent): boolean {
  return hasHiddenTags(event) && getHiddenTags(event) === undefined;
}

/** Returns either nip04 or nip44 encryption method depending on list kind */
export function getListEncryptionMethods(kind: number, signer: HiddenContentSigner) {
  return getHiddenContentEncryptionMethods(kind, signer);
}

/**
 * Decrypts the private list
 * @param event The list event to decrypt
 * @param signer A signer to use to decrypt the tags
 * @param store An optional EventStore to notify about the update
 * @throws
 */
export async function unlockHiddenTags<T extends { kind: number; pubkey: string; content: string }>(
  event: T,
  signer: HiddenContentSigner,
  store?: EventStore,
): Promise<T> {
  if (!canHaveHiddenTags(event.kind)) throw new Error("Event kind does not support hidden tags");
  const plaintext = await unlockHiddenContent(event, signer);

  const parsed = JSON.parse(plaintext) as string[][];
  if (!Array.isArray(parsed)) throw new Error("Content is not an array of tags");

  // Convert array to tags array string[][]
  const tags = parsed.filter((t) => Array.isArray(t)).map((t) => t.map((v) => String(v)));

  Reflect.set(event, HiddenTagsSymbol, tags);

  if (store && isEvent(event)) store.update(event);

  return event;
}

/**
 * Override the hidden tags in an event
 * @deprecated use EventFactory to create draft events
 * @throws
 */
export async function overrideHiddenTags(
  event: NostrEvent,
  hidden: string[][],
  signer: HiddenContentSigner,
): Promise<EventTemplate> {
  if (!canHaveHiddenTags(event.kind)) throw new Error("Event kind does not support hidden tags");
  const encryption = getListEncryptionMethods(event.kind, signer);
  const ciphertext = await encryption.encrypt(event.pubkey, JSON.stringify(hidden));

  return {
    kind: event.kind,
    content: ciphertext,
    created_at: unixNow(),
    tags: event.tags,
  };
}
