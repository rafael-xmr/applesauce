import { NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "./cache.js";
import { safeRelayUrl } from "./relays.js";

export const ContactsRelaysSymbol = Symbol.for("contacts-relays");

type RelayJson = Record<string, { read: boolean; write: boolean }>;
export function relaysFromContactsEvent(event: NostrEvent) {
  return getOrComputeCachedValue(event, ContactsRelaysSymbol, () => {
    try {
      const relayJson = JSON.parse(event.content) as RelayJson;

      const relays = new Map<string, "inbox" | "outbox" | "all">();
      for (const [url, opts] of Object.entries(relayJson)) {
        const safeUrl = safeRelayUrl(url);
        if (!safeUrl) continue;

        if (opts.write && opts.read) relays.set(safeUrl, "all");
        else if (opts.read) relays.set(safeUrl, "inbox");
        else if (opts.write) relays.set(safeUrl, "outbox");
      }

      return relays;
    } catch (error) {
      return null;
    }
  });
}
