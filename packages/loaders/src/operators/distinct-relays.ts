import { safeRelayUrls } from "applesauce-core/helpers";
import { filter, map, OperatorFunction, share } from "rxjs";

interface Message {
  relays?: string[];
  /** Ignore timeout and force message through */
  force?: boolean;
  [key: string]: any;
}

export function distinctRelays<T extends Message>(
  keyFn: (message: T) => string,
  timeout = 60_000,
): OperatorFunction<T, T> {
  return (source$) => {
    const cache = new Map<string, number>();

    return source$.pipe(
      map((message) => {
        if (message.force) return message;

        let key = keyFn(message);
        let now = Date.now();

        if (message.relays) {
          // requesting from specific relays
          let relays = safeRelayUrls(message.relays);

          relays = relays.filter((relay) => {
            let relayKey = key + " " + relay;
            let last = cache.get(relayKey);
            if (!last || now >= last + timeout) {
              cache.set(relayKey, now);
              return true;
            } else return false;
          });

          if (relays.length === 0) return null;

          return { ...message, relays };
        } else {
          // requesting from default relays
          let last = cache.get(key);
          if (!last || now >= last + timeout) {
            cache.set(key, now);
            return message;
          } else return null;
        }
      }),
      filter((message) => message !== null) as OperatorFunction<T | null, T>,
      share(),
    );
  };
}
