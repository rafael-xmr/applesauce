import { NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "./cache.js";
import { isSafeRelayURL } from "./relays.js";

export const ContactsRelaysSymbol = Symbol.for("contacts-relays");

type RelayJson = Record<string, { read: boolean; write: boolean }>;
export function getRelaysFromContactsEvent(event: NostrEvent) {
  return getOrComputeCachedValue(event, ContactsRelaysSymbol, () => {
    try {
      const relayJson = JSON.parse(event.content) as RelayJson;

      const relays = new Map<string, "inbox" | "outbox" | "all">();
      for (const [url, opts] of Object.entries(relayJson)) {
        if (!isSafeRelayURL(url)) continue;

        if (opts.write && opts.read) relays.set(url, "all");
        else if (opts.read) relays.set(url, "inbox");
        else if (opts.write) relays.set(url, "outbox");
      }

      return relays;
    } catch (error) {
      return null;
    }
  });
}
