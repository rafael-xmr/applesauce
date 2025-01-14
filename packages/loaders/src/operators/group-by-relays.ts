import { from, groupBy, GroupedObservable, map, mergeMap, OperatorFunction, share } from "rxjs";

interface Message {
  relays?: string[];
  [key: string]: any;
}

/** Splits a stream of messages out into relay specific observables */
export function groupByRelays<T extends Message>(
  defaultRelay: string,
): OperatorFunction<T, GroupedObservable<string, T>> {
  return (source$) => {
    return source$.pipe(
      mergeMap((message) => {
        const relays = message.relays?.length ? message.relays : [defaultRelay];
        return from(relays).pipe(map((relay) => ({ relay, message })));
      }),
      groupBy((pair) => pair.relay, { element: (pair) => pair.message }),
      share(),
    );
  };
}
