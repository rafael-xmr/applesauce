import { EventTemplate, kinds, NostrEvent } from "nostr-tools";
import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";

import { isATag, isETag } from "./tags.js";
import { unixNow } from "./time.js";
import { getATagFromAddressPointer, getETagFromEventPointer } from "./pointers.js";
import { getTagValue } from "./index.js";

export function getDeleteIds(deleteEvent: NostrEvent) {
  return deleteEvent.tags.filter(isETag).map((t) => t[1]);
}

export function getDeleteCoordinates(deleteEvent: NostrEvent) {
  return deleteEvent.tags.filter(isATag).map((t) => t[1]);
}

/** Creates a NIP-09 delete event for an array of events */
export function createDeleteEvent(events: NostrEvent[], message?: string): EventTemplate {
  const eventPointers: EventPointer[] = [];
  const addressPointers: AddressPointer[] = [];
  const eventKinds = new Set<number>();

  for (const event of events) {
    eventKinds.add(event.kind);
    eventPointers.push({ id: event.id });

    if (isParameterizedReplaceableKind(event.kind)) {
      const identifier = getTagValue(event, "d");
      if (!identifier) throw new Error("Event missing identifier");

      addressPointers.push({ pubkey: event.pubkey, kind: event.kind, identifier });
    }
  }

  return {
    kind: kinds.EventDeletion,
    content: message ?? "",
    tags: [
      ...eventPointers.map(getETagFromEventPointer),
      ...addressPointers.map(getATagFromAddressPointer),
      ...Array.from(eventKinds).map((k) => ["k", String(k)]),
    ],
    created_at: unixNow(),
  };
}
