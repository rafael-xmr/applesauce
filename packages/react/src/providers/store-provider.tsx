import { EventStore, QueryStore } from "applesauce-core";
import { createContext, PropsWithChildren } from "react";

export const QueryStoreContext = createContext<QueryStore | null>(null);
export const EventStoreContext = createContext<EventStore | null>(null);

/** Provides a EventStore to the component tree */
export function EventStoreProvider({ eventStore, children }: PropsWithChildren<{ eventStore: EventStore }>) {
  return <EventStoreContext.Provider value={eventStore}>{children}</EventStoreContext.Provider>;
}

/** Provides a QueryStore and EventStore to the component tree */
export function QueryStoreProvider({ queryStore, children }: PropsWithChildren<{ queryStore: QueryStore }>) {
  return (
    <EventStoreProvider eventStore={queryStore.store}>
      <QueryStoreContext.Provider value={queryStore}>{children}</QueryStoreContext.Provider>
    </EventStoreProvider>
  );
}
