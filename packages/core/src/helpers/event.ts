import { kinds, NostrEvent } from "nostr-tools";
import { INDEXABLE_TAGS } from "../event-store/common.js";
import { EventIndexableTags, EventUID } from "./symbols.js";

export function isReplaceable(kind: number) {
  return kinds.isReplaceableKind(kind) || kinds.isParameterizedReplaceableKind(kind);
}

/** returns the events Unique ID */
export function getEventUID(event: NostrEvent) {
  if (!event[EventUID]) {
    if (isReplaceable(event.kind)) {
      const d = event.tags.find((t) => t[0] === "d")?.[1];
      event[EventUID] = getReplaceableUID(event.kind, event.pubkey, d);
    } else {
      event[EventUID] = event.id;
    }
  }

  return event[EventUID];
}

export function getReplaceableUID(kind: number, pubkey: string, d?: string) {
  return d ? `${kind}:${pubkey}:${d}` : `${kind}:${pubkey}`;
}

export function getIndexableTags(event: NostrEvent) {
  if (!event[EventIndexableTags]) {
    const tags = new Set<string>();

    for (const tag of event.tags) {
      if (tag[0] && INDEXABLE_TAGS.has(tag[0]) && tag[1]) {
        tags.add(tag[0] + ":" + tag[1]);
      }
    }

    event[EventIndexableTags] = tags;
  }

  return event[EventIndexableTags]!;
}
