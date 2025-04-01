import { useMemo } from "react";
import { of } from "rxjs";
import { useObservableEagerState } from "observable-hooks";
import type { QueryConstructor } from "applesauce-core";

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

	const argsString = args
		? args.map((arg) => JSON.stringify(arg)).join(",")
		: "";

	const observable = useMemo(() => {
		if (args) return store.createQuery(queryConstructor, ...args);
		return of(undefined);
	}, [argsString]);

	return useObservableEagerState(observable);
}
