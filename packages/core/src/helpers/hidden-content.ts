import * as kinds from "nostr-tools/kinds";

import { GROUPS_LIST_KIND } from "./groups.js";
import { getParentEventStore, isEvent } from "./event.js";

export const HiddenContentSymbol = Symbol.for("hidden-content");

export type HiddenContentSigner = {
  nip04?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
  nip44?: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
};

/** Various event kinds that can have encrypted tags in their content and which encryption method they use */
export const EventContentEncryptionMethod: Record<number, "nip04" | "nip44"> = {
  // NIP-60 wallet
  17375: "nip44",
  375: "nip44",
  7375: "nip44",
  7376: "nip44",

  // DMs
  [kinds.EncryptedDirectMessage]: "nip04",

  // Gift wraps
  [kinds.GiftWrap]: "nip44",

  // NIP-51 lists
  [kinds.BookmarkList]: "nip04",
  [kinds.InterestsList]: "nip04",
  [kinds.Mutelist]: "nip04",
  [kinds.CommunitiesList]: "nip04",
  [kinds.PublicChatsList]: "nip04",
  [kinds.SearchRelaysList]: "nip04",
  [GROUPS_LIST_KIND]: "nip04",

  // NIP-51 sets
  [kinds.Bookmarksets]: "nip04",
  [kinds.Relaysets]: "nip04",
  [kinds.Followsets]: "nip04",
  [kinds.Curationsets]: "nip04",
  [kinds.Interestsets]: "nip04",
};

/** Sets the encryption method that is used for the contents of a specific event kind */
export function setEventContentEncryptionMethod(kind: number, method: "nip04" | "nip44") {
  EventContentEncryptionMethod[kind] = method;
}

/** Checks if an event can have hidden content */
export function canHaveHiddenContent(kind: number): boolean {
  return EventContentEncryptionMethod[kind] !== undefined;
}

/** Checks if an event has hidden content */
export function hasHiddenContent<T extends { kind: number; content: string }>(event: T): boolean {
  return canHaveHiddenContent(event.kind) && event.content.length > 0;
}

/** Returns the hidden tags for an event if they are unlocked */
export function getHiddenContent<T extends object>(event: T): string | undefined {
  return Reflect.get(event, HiddenContentSymbol) as string | undefined;
}

/** Checks if the hidden tags are locked */
export function isHiddenContentLocked<T extends object>(event: T): boolean {
  return Reflect.has(event, HiddenContentSymbol) === false;
}

/** Returns either nip04 or nip44 encryption methods depending on event kind */
export function getHiddenContentEncryptionMethods(kind: number, signer: HiddenContentSigner) {
  const method = EventContentEncryptionMethod[kind];
  const encryption = signer[method];
  if (!encryption) throw new Error(`Signer does not support ${method} encryption`);

  return encryption;
}

export type HiddenContentEvent = { kind: number; pubkey: string; content: string };

/**
 * Unlocks the encrypted content in an event
 * @param event The event with content to decrypt
 * @param signer A signer to use to decrypt the tags
 * @throws
 */
export async function unlockHiddenContent<T extends HiddenContentEvent>(
  event: T,
  signer: HiddenContentSigner,
): Promise<string> {
  if (!canHaveHiddenContent(event.kind)) throw new Error("Event kind does not support hidden content");
  const encryption = getHiddenContentEncryptionMethods(event.kind, signer);
  const plaintext = await encryption.decrypt(event.pubkey, event.content);

  Reflect.set(event, HiddenContentSymbol, plaintext);

  // if the event has been added to an event store, notify it
  if (isEvent(event)) {
    const eventStore = getParentEventStore(event);
    if (eventStore) eventStore.update(event);
  }

  return plaintext;
}

/** Removes the unencrypted hidden content on an event */
export function lockHiddenContent<T extends object>(event: T) {
  Reflect.deleteProperty(event, HiddenContentSymbol);

  // if the event has been added to an event store, notify it
  if (isEvent(event)) {
    const eventStore = getParentEventStore(event);
    if (eventStore) eventStore.update(event);
  }
}
