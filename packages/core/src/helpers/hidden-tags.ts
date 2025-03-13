import {
  canHaveHiddenContent,
  getHiddenContent,
  getHiddenContentEncryptionMethods,
  HiddenContentEvent,
  HiddenContentSigner,
  isHiddenContentLocked,
  lockHiddenContent,
  unlockHiddenContent,
} from "./hidden-content.js";
import { getOrComputeCachedValue } from "./cache.js";

export const HiddenTagsSymbol = Symbol.for("hidden-tags");

/** Checks if an event can have hidden tags */
export function canHaveHiddenTags(kind: number): boolean {
  return canHaveHiddenContent(kind);
}

/** Checks if an event has hidden tags */
export function hasHiddenTags<T extends { content: string; kind: number }>(event: T): boolean {
  return canHaveHiddenTags(event.kind) && event.content.length > 0;
}

/** Returns the hidden tags for an event if they are unlocked */
export function getHiddenTags<T extends object>(event: T): string[][] | undefined {
  if (isHiddenTagsLocked(event)) return undefined;

  return getOrComputeCachedValue(event, HiddenTagsSymbol, () => {
    const plaintext = getHiddenContent(event)!;

    const parsed = JSON.parse(plaintext) as string[][];
    if (!Array.isArray(parsed)) throw new Error("Content is not an array of tags");

    // Convert array to tags array string[][]
    return parsed.filter((t) => Array.isArray(t)).map((t) => t.map((v) => String(v)));
  });
}

/** Checks if the hidden tags are locked */
export function isHiddenTagsLocked<T extends object>(event: T): boolean {
  return isHiddenContentLocked(event);
}

/** Returns either nip04 or nip44 encryption method depending on list kind */
export function getHiddenTagsEncryptionMethods(kind: number, signer: HiddenContentSigner) {
  return getHiddenContentEncryptionMethods(kind, signer);
}

/**
 * Decrypts the private list
 * @param event The list event to decrypt
 * @param signer A signer to use to decrypt the tags
 * @param store An optional EventStore to notify about the update
 * @throws
 */
export async function unlockHiddenTags<T extends HiddenContentEvent>(
  event: T,
  signer: HiddenContentSigner,
): Promise<string[][]> {
  if (!canHaveHiddenTags(event.kind)) throw new Error("Event kind does not support hidden tags");

  // unlock hidden content is needed
  if (isHiddenContentLocked(event)) await unlockHiddenContent(event, signer);

  return getHiddenTags(event)!;
}

export function lockHiddenTags<T extends object>(event: T) {
  Reflect.deleteProperty(event, HiddenTagsSymbol);
  lockHiddenContent(event);
}
