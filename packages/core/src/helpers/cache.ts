import { EventTemplate, NostrEvent } from "nostr-tools";

export function getCachedValue<T extends unknown>(event: NostrEvent | EventTemplate, symbol: symbol): T | undefined {
  return Reflect.get(event, symbol);
}

export function setCachedValue<T extends unknown>(event: NostrEvent | EventTemplate, symbol: symbol, value: T) {
  Reflect.set(event, symbol, value);
}

/** Internal method used to cache computed values on events */
export function getOrComputeCachedValue<T extends unknown>(
  event: NostrEvent | EventTemplate,
  symbol: symbol,
  compute: (event: NostrEvent | EventTemplate) => T,
): T {
  if (Reflect.has(event, symbol)) {
    return Reflect.get(event, symbol);
  } else {
    const value = compute(event);
    Reflect.set(event, symbol, value);
    return value;
  }
}
