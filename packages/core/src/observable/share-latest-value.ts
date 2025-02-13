import { BehaviorSubject, OperatorFunction, share } from "rxjs";

/**
 * Creates an operator that adds a 'value' property and multiplexes the source
 * @param config Optional ShareConfig for customizing sharing behavior
 */
export function shareLatestValue<T>(): OperatorFunction<T, T | undefined> {
  return (source$) => source$.pipe(share({ connector: () => new BehaviorSubject<T | undefined>(undefined) }));

  // return (source: Observable<T>): Observable<T> & { value: T | undefined } => {
  //   // Create storage for latest value
  //   let latestValue: T | undefined = undefined;

  //   // Create shared source with value tracking
  //   const shared$ = source.pipe(
  //     tap((value) => {
  //       latestValue = value;
  //     }),
  //     share(config),
  //   );

  //   // Add value property
  //   Object.defineProperty(shared$, "value", {
  //     get: () => latestValue,
  //   });

  //   return shared$ as Observable<T> & { value: T | undefined };
  // };
}
