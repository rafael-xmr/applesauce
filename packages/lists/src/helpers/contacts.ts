import { NostrEvent } from "nostr-tools";
import { getProfilePointerFromTag, isPTag, safeRelayUrl } from "applesauce-core/helpers";
import { getOrComputeCachedValue } from "applesauce-core/helpers/cache";

export const ContactsRelaysSymbol = Symbol.for("contacts-relays");
export const ContactsPeopleSymbol = Symbol.for("contacts-people");

export function getContactsPeople(contacts: NostrEvent) {
  return getOrComputeCachedValue(contacts, ContactsPeopleSymbol, () =>
    contacts.tags.filter(isPTag).map(getProfilePointerFromTag),
  );
}

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
