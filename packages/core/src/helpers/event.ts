import { kinds, NostrEvent } from "nostr-tools";
import { INDEXABLE_TAGS } from "../event-store/common.js";

export const EventUIDSymbol = Symbol.for("event-uid");
export const EventIndexableTagsSymbol = Symbol.for("indexable-tags");
declare module "nostr-tools" {
  export interface Event {
    [EventUIDSymbol]?: string;
    [EventIndexableTagsSymbol]?: Set<string>;
  }
}

/**
 * Returns if a kind is replaceable ( 10000 <= n < 20000 || n == 0 || n == 3 )
 * or parameterized replaceable ( 30000 <= n < 40000 )
 */
export function isReplaceable(kind: number) {
  return kinds.isReplaceableKind(kind) || kinds.isParameterizedReplaceableKind(kind);
}

/** returns the events Unique ID */
export function getEventUID(event: NostrEvent) {
  if (!event[EventUIDSymbol]) {
    if (isReplaceable(event.kind)) {
      const d = event.tags.find((t) => t[0] === "d")?.[1];
      event[EventUIDSymbol] = getReplaceableUID(event.kind, event.pubkey, d);
    } else {
      event[EventUIDSymbol] = event.id;
    }
  }

  return event[EventUIDSymbol];
}

export function getReplaceableUID(kind: number, pubkey: string, d?: string) {
  return d ? `${kind}:${pubkey}:${d}` : `${kind}:${pubkey}`;
}

export function getIndexableTags(event: NostrEvent) {
  if (!event[EventIndexableTagsSymbol]) {
    const tags = new Set<string>();

    for (const tag of event.tags) {
      if (tag[0] && INDEXABLE_TAGS.has(tag[0]) && tag[1]) {
        tags.add(tag[0] + ":" + tag[1]);
      }
    }

    event[EventIndexableTagsSymbol] = tags;
  }

  return event[EventIndexableTagsSymbol]!;
}
