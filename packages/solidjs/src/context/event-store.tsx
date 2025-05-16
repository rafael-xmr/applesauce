import { createContext, ParentProps, useContext } from "solid-js";
import { IEventStore } from "applesauce-core";

export const EventStoreContext = createContext<IEventStore>();

/** Returns the EventStore from the context. If required is true, it will throw an error if the EventStore is not found. */
export function useEventStore(required: false): IEventStore | undefined;
export function useEventStore(required: true): IEventStore;
export function useEventStore(required = true): IEventStore | undefined {
  const eventStore = useContext(EventStoreContext);
  if (!eventStore && required) throw new Error("EventStore not found");
  return eventStore;
}

/** Provides an EventStore to the app. */
export function EventStoreProvider(props: ParentProps<{ eventStore: IEventStore }>) {
  return <EventStoreContext.Provider value={props.eventStore}>{props.children}</EventStoreContext.Provider>;
}
