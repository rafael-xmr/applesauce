import { unixNow } from "applesauce-core/helpers";
import { EventTemplate, kinds, NostrEvent, UnsignedEvent } from "nostr-tools";
import { EventStore } from "applesauce-core";

export type HiddenTagsSigner = {
  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
};
export type TagOperation = (tags: string[][]) => string[][];

export const HiddenTagsSymbol = Symbol.for("hidden-tags");

export const EventsWithHiddenTags = [
  37375, // NIP-60 wallet

  // NIP-51 lists
  kinds.BookmarkList,
  kinds.InterestsList,
  kinds.Mutelist,
  kinds.CommunitiesList,
  kinds.PublicChatsList,
  kinds.SearchRelaysList,
  kinds.SearchRelaysList,
  10009, // NIP-29 groups

  // NIP-51 sets
  kinds.Bookmarksets,
  kinds.Relaysets,
  kinds.Followsets,
  kinds.Curationsets,
  kinds.Interestsets,
];

/** Checks if an event can have hidden tags */
export function canHaveHiddenTags(event: NostrEvent | EventTemplate) {
  return EventsWithHiddenTags.includes(event.kind);
}

/** Checks if an event has hidden tags */
export function hasHiddenTags(event: NostrEvent | EventTemplate) {
  return canHaveHiddenTags(event) && event.content.length > 0;
}

/** Returns the hidden tags from an event if they are unlocked */
export function getHiddenTags(event: NostrEvent | EventTemplate) {
  return Reflect.get(event, HiddenTagsSymbol) as string[][] | undefined;
}

export function isHiddenTagsLocked(event: NostrEvent) {
  return hasHiddenTags(event) && getHiddenTags(event) === undefined;
}

/**
 * Decrypts the private list
 * @param event The list event to decrypt
 * @param signer A signer to use to decrypt the tags
 * @param store An optional EventStore to notify about the update
 */
export async function unlockHiddenTags(
  event: NostrEvent,
  signer: HiddenTagsSigner,
  store?: EventStore,
): Promise<NostrEvent> {
  const plaintext = await signer.nip04.decrypt(event.pubkey, event.content);
  const parsed = JSON.parse(plaintext) as string[][];
  if (!Array.isArray(parsed)) throw new Error("Content is not an array of tags");

  // Convert array to tags array string[][]
  const tags = parsed.filter((t) => Array.isArray(t)).map((t) => t.map((v) => String(v)));

  Reflect.set(event, HiddenTagsSymbol, tags);

  if (store) store.update(event);

  return event;
}

/**
 * Modifies tags and returns an EventTemplate
 * @param event Event to modify
 * @param operations Operations for hidden and public tags
 * @param signer A signer to use to decrypt the tags
 */
export async function modifyEventTags(
  event: NostrEvent | UnsignedEvent,
  operations: { public?: TagOperation; hidden?: TagOperation },
  signer?: HiddenTagsSigner,
): Promise<EventTemplate> {
  const draft: EventTemplate = { content: event.content, tags: event.tags, kind: event.kind, created_at: unixNow() };

  if (operations.public) {
    draft.tags = operations.public(event.tags);
  }

  if (operations.hidden) {
    if (!signer) throw new Error("Missing signer for hidden tags");
    if (!canHaveHiddenTags(event)) throw new Error("Event can not have hidden tags");

    const hidden = hasHiddenTags(event) ? getHiddenTags(event) : [];
    if (!hidden) throw new Error("Hidden tags are locked");

    const newHidden = operations.hidden(hidden);
    draft.content = await signer.nip04.encrypt(event.pubkey, JSON.stringify(newHidden));
  }

  return draft;
}

/**
 * Override the hidden tags in an event
 */
export async function overrideHiddenTags(
  event: NostrEvent,
  hidden: string[][],
  signer: HiddenTagsSigner,
): Promise<EventTemplate> {
  const ciphertext = await signer.nip04.encrypt(event.pubkey, JSON.stringify(hidden));

  return {
    kind: event.kind,
    content: ciphertext,
    created_at: unixNow(),
    tags: event.tags,
  };
}
