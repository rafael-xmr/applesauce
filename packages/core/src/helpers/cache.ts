export function getCachedValue<T extends unknown>(event: any, symbol: symbol): T | undefined {
  return Reflect.get(event, symbol);
}

export function setCachedValue<T extends unknown>(event: any, symbol: symbol, value: T) {
  Reflect.set(event, symbol, value);
}

/** Internal method used to cache computed values on events */
export function getOrComputeCachedValue<T extends unknown>(event: any, symbol: symbol, compute: () => T): T {
  if (Reflect.has(event, symbol)) {
    return Reflect.get(event, symbol);
  } else {
    const value = compute();
    Reflect.set(event, symbol, value);
    return value;
  }
}
