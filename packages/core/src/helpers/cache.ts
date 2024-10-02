import { EventTemplate, NostrEvent } from "nostr-tools";

export function getCachedValue<T extends unknown>(event: NostrEvent | EventTemplate, symbol: symbol): T | undefined {
  // @ts-expect-error
  return event[symbol];
}

export function setCachedValue<T extends unknown>(event: NostrEvent | EventTemplate, symbol: symbol, value: T) {
  // @ts-expect-error
  event[symbol] = value;
}

/** Internal method used to cache computed values on events */
export function getOrComputeCachedValue<T extends unknown>(
  event: NostrEvent | EventTemplate,
  symbol: symbol,
  compute: (event: NostrEvent | EventTemplate) => T,
): T {
  let cached = getCachedValue<T>(event, symbol);

  if (!cached) {
    // @ts-expect-error
    cached = event[symbol] = compute(event);
  }

  return cached;
}
