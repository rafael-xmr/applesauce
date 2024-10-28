import { Observable, share, ShareConfig } from "rxjs";
import { tap } from "rxjs/operators";

/**
 * Creates an operator that adds a 'value' property and multiplexes the source
 * @param config Optional ShareConfig for customizing sharing behavior
 */
export function shareLatestValue<T>(config: ShareConfig<T> = {}) {
  return (source: Observable<T>): Observable<T> & { value: T | undefined } => {
    // Create storage for latest value
    let latestValue: T | undefined = undefined;

    // Create shared source with value tracking
    const shared$ = source.pipe(
      tap((value) => {
        latestValue = value;
      }),
      share(config),
    );

    // Add value property
    Object.defineProperty(shared$, "value", {
      get: () => latestValue,
    });

    return shared$ as Observable<T> & { value: T | undefined };
  };
}
