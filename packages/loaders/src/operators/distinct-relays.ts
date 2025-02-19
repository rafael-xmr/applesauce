import { filter, map, OperatorFunction } from "rxjs";
import { MessageWithRelay, removePreviouslyUsedRelays } from "../helpers/pointer.js";

export function distinctRelays<T extends MessageWithRelay>(
  keyFn: (message: T) => string,
  timeout = 60_000,
): OperatorFunction<T, T> {
  return (source$) => {
    const cache = new Map<string, number>();

    return source$.pipe(
      map((message) => removePreviouslyUsedRelays(message, keyFn, cache, timeout)),
      filter((message) => message !== null) as OperatorFunction<T | null, T>,
    );
  };
}

export function distinctRelaysBatch<T extends MessageWithRelay>(
  keyFn: (message: T) => string,
  timeout = 60_000,
): OperatorFunction<T[], T[]> {
  return (source$) => {
    const cache = new Map<string, number>();

    return source$.pipe(
      map((batch) => batch.map((m) => removePreviouslyUsedRelays(m, keyFn, cache, timeout)).filter((m) => m !== null)),
    );
  };
}
