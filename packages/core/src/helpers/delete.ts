import { NostrEvent } from "nostr-tools";

import { isATag, isETag } from "./tags.js";

export function getDeleteIds(deleteEvent: NostrEvent): string[] {
  return deleteEvent.tags.filter(isETag).map((t) => t[1]);
}

export function getDeleteCoordinates(deleteEvent: NostrEvent): string[] {
  return deleteEvent.tags.filter(isATag).map((t) => t[1]);
}
