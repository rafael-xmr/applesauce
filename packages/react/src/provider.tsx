import { QueryStore } from "applesauce-core";
import { createContext, PropsWithChildren, useContext } from "react";

const QueryStoreContext = createContext<QueryStore | null>(null);

export function useQueryStore() {
  const store = useContext(QueryStoreContext);
  if (!store) throw new Error("Missing QueryStoreProvider");
  return store;
}

export function QueryStoreProvider({ store, children }: PropsWithChildren<{ store: QueryStore }>) {
  return <QueryStoreContext.Provider value={store}>{children}</QueryStoreContext.Provider>;
}
