import { NostrEvent } from "nostr-tools";
import { safeParse } from "./json.js";
import { getOrComputeCachedValue } from "./cache.js";

export const SharedEventSymbol = Symbol.for("shared-event");

/** Returns the stringified event in the content of a kind 6 or 16 share event */
export function parseSharedEvent(event: NostrEvent): NostrEvent | undefined {
  return getOrComputeCachedValue(event, SharedEventSymbol, () => {
    const json = safeParse<NostrEvent>(event.content);
    if (!json) return;
    return json;
  });
}
