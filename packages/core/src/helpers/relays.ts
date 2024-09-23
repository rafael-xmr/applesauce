import { NostrEvent } from "nostr-tools";

export const EventRelays = Symbol.for("event-relays");

// extend type
declare module "nostr-tools" {
  export interface Event {
    [EventRelays]?: Set<string>;
  }
}

export function addEventRelay(event: NostrEvent, relay: string) {
  if (!event[EventRelays]) event[EventRelays] = new Set();

  event[EventRelays].add(relay);

  return event[EventRelays];
}
