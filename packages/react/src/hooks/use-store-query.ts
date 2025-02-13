import { useMemo } from "react";
import { EMPTY } from "rxjs";
import { QueryConstructor } from "applesauce-core";

import { useObservable } from "./use-observable.js";
import { useQueryStore } from "./use-query-store.js";

/**
 * Runs and subscribes to a query in the query store
 * @example
 * const events = useStoreQuery(TimelineQuery, [{kinds: [1]}])
 */
export function useStoreQuery<T extends unknown, Args extends Array<any>>(
  queryConstructor: QueryConstructor<T, Args>,
  args?: Args | null,
): T | undefined {
  const store = useQueryStore();
  const observable = useMemo(() => {
    if (args) return store.createQuery(queryConstructor, ...args);
    else return EMPTY;
  }, [args, store]);

  return useObservable(observable);
}
