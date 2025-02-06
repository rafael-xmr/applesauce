import { EventTemplate, kinds, NostrEvent, VerifiedEvent, verifiedSymbol } from "nostr-tools";
import { INDEXABLE_TAGS } from "../event-store/common.js";
import { getHiddenTags } from "./hidden-tags.js";
import { getOrComputeCachedValue } from "./cache.js";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";

export const EventUIDSymbol = Symbol.for("event-uid");
export const EventIndexableTagsSymbol = Symbol.for("indexable-tags");
export const FromCacheSymbol = Symbol.for("from-cache");
export const ReplaceableIdentifierSymbol = Symbol.for("replaceable-identifier");

declare module "nostr-tools" {
  export interface Event {
    [EventUIDSymbol]?: string;
    [EventIndexableTagsSymbol]?: Set<string>;
    [FromCacheSymbol]?: boolean;
  }
}

/**
 * Checks if an object is a nostr event
 * NOTE: does not validation the signature on the event
 */
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

/**
 * Returns if a kind is replaceable ( 10000 <= n < 20000 || n == 0 || n == 3 )
 * or parameterized replaceable ( 30000 <= n < 40000 )
 */
export function isReplaceable(kind: number) {
  return kinds.isReplaceableKind(kind) || kinds.isParameterizedReplaceableKind(kind);
}

/**
 * Returns the events Unique ID
 * For normal or ephemeral events this is ( event.id )
 * For replaceable events this is ( event.kind + ":" + event.pubkey )
 * For parametrized replaceable events this is ( event.kind + ":" + event.pubkey + ":" + event.tags.d.1 )
 */
export function getEventUID(event: NostrEvent) {
  let id = event[EventUIDSymbol];

  if (!id) {
    if (isReplaceable(event.kind)) {
      const d = event.tags.find((t) => t[0] === "d")?.[1];
      id = getReplaceableUID(event.kind, event.pubkey, d);
    } else {
      id = event.id;
    }
  }

  return id;
}

export function getReplaceableUID(kind: number, pubkey: string, d?: string) {
  return d ? `${kind}:${pubkey}:${d}` : `${kind}:${pubkey}`;
}

/** Returns a Set of tag names and values that are indexable */
export function getIndexableTags(event: NostrEvent) {
  let indexable = event[EventIndexableTagsSymbol];
  if (!indexable) {
    const tags = new Set<string>();

    for (const tag of event.tags) {
      if (tag[0] && INDEXABLE_TAGS.has(tag[0]) && tag[1]) {
        tags.add(tag[0] + ":" + tag[1]);
      }
    }

    indexable = event[EventIndexableTagsSymbol] = tags;
  }

  return indexable;
}

/**
 * Returns the second index ( tag[1] ) of the first tag that matches the name
 * If the event has any hidden tags they will be searched first
 */
export function getTagValue(event: NostrEvent | EventTemplate, name: string) {
  const hidden = getHiddenTags(event);

  const hiddenValue = hidden?.find((t) => t[0] === name)?.[1];
  if (hiddenValue) return hiddenValue;
  return event.tags.find((t) => t[0] === name)?.[1];
}

/** Sets events verified flag without checking anything */
export function fakeVerifyEvent(event: NostrEvent): event is VerifiedEvent {
  event[verifiedSymbol] = true;
  return true;
}

/** Marks an event as being from a cache */
export function markFromCache(event: NostrEvent) {
  event[FromCacheSymbol] = true;
}

/** Returns if an event was from a cache */
export function isFromCache(event: NostrEvent) {
  return !!event[FromCacheSymbol];
}

/**
 * Returns the replaceable identifier for a replaceable event
 * @throws
 */
export function getReplaceableIdentifier(event: NostrEvent): string {
  if (!isParameterizedReplaceableKind(event.kind)) throw new Error("Event is not replaceable");

  return getOrComputeCachedValue(event, ReplaceableIdentifierSymbol, () => {
    const d = getTagValue(event, "d");
    if (d === undefined) throw new Error("Event missing identifier");
    return d;
  });
}
