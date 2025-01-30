import { NostrEvent } from "nostr-tools";

export const SeenRelaysSymbol = Symbol.for("seen-relays");
declare module "nostr-tools" {
  export interface Event {
    [SeenRelaysSymbol]?: Set<string>;
  }
}

// Seen relays
export function addSeenRelay(event: NostrEvent, relay: string) {
  if (!event[SeenRelaysSymbol]) event[SeenRelaysSymbol] = new Set();

  event[SeenRelaysSymbol].add(relay);

  return event[SeenRelaysSymbol];
}
export function getSeenRelays(event: NostrEvent) {
  return event[SeenRelaysSymbol];
}

// Relay URLs
export function validateRelayURL(relay: string | URL) {
  if (typeof relay === "string" && relay.includes(",ws")) throw new Error("Can not have multiple relays in one string");
  const url = typeof relay === "string" ? new URL(relay) : relay;
  if (url.protocol !== "wss:" && url.protocol !== "ws:") throw new Error("Incorrect protocol");
  return url;
}

export function safeRelayUrl(relayUrl: string | URL) {
  try {
    return validateRelayURL(relayUrl).toString();
  } catch (e) {
    return null;
  }
}

export function safeRelayUrls(urls: Iterable<string>): string[] {
  return Array.from(urls).map(safeRelayUrl).filter(Boolean) as string[];
}

export function mergeRelaySets(...sources: (Iterable<string> | undefined)[]) {
  const set = new Set<string>();
  for (const src of sources) {
    if (!src) continue;
    for (const url of src) {
      const safe = safeRelayUrl(url);
      if (safe) set.add(safe);
    }
  }
  return Array.from(set);
}
