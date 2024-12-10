import { QueryStore } from "applesauce-core";
import { createContext, PropsWithChildren } from "react";

export const QueryStoreContext = createContext<QueryStore | null>(null);

/** Provides a QueryStore to the component tree */
export function QueryStoreProvider({ store, children }: PropsWithChildren<{ store: QueryStore }>) {
  return <QueryStoreContext.Provider value={store}>{children}</QueryStoreContext.Provider>;
}
