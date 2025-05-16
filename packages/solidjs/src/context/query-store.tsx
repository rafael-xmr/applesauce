import { createContext, ParentProps, useContext } from "solid-js";
import { QueryStore } from "applesauce-core";
import { EventStoreContext, EventStoreProvider } from "./event-store.jsx";

export const QueryStoreContext = createContext<QueryStore>();

/** Returns the QueryStore from the context. If required is true, it will throw an error if the QueryStore is not found. */
export function useQueryStore(required: false): QueryStore | undefined;
export function useQueryStore(required: true): QueryStore;
export function useQueryStore(required = true): QueryStore | undefined {
  const queryStore = useContext(QueryStoreContext);
  if (!queryStore && required) throw new Error("QueryStore not found");
  return queryStore;
}

/** Provides a QueryStore and an EventStore. If an EventStore is not provided, it will provide the one from the QueryStore. */
export function QueryStoreProvider(props: ParentProps<{ queryStore: QueryStore }>) {
  const eventStore = useContext(EventStoreContext);

  const provider = <QueryStoreContext.Provider value={props.queryStore}>{props.children}</QueryStoreContext.Provider>;

  // If there isn't an event store, provide the one from the query store
  if (!eventStore) return <EventStoreProvider eventStore={props.queryStore.store}>{provider}</EventStoreProvider>;
  else return provider;
}
