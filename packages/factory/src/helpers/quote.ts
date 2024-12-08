import { EventPointer } from "nostr-tools/nip19";
import { fillAndTrimTag } from "./tag.js";

/** Creates a "q" tag for an EventPointer */
export function createQuoteTagFromEventPointer(pointer: EventPointer) {
  const tag = ["q", pointer.id];
  if (pointer.relays) tag[2] = pointer.relays[0];
  if (pointer.author) tag[3] = pointer.author;
  return fillAndTrimTag(tag);
}
