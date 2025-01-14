import { LRU } from "applesauce-core/helpers";
import { filter, OperatorFunction } from "rxjs";

/** Filters out duplicate values based on a key getter and a TTL */
export function distinctTimeout<T>(keyFn: (value: T) => string, ttl = 1000): OperatorFunction<T, T> {
  const seen = new LRU(undefined, ttl);

  return (source) =>
    source.pipe(
      filter((value) => {
        const key = keyFn(value);
        if (seen.has(key)) return false;
        else {
          seen.set(key, Date.now());
          return true;
        }
      }),
    );
}
