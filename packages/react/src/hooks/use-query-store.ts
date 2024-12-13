import { useContext } from "react";
import { QueryStoreContext } from "../providers/store-provider.js";

/**
 * Gets the QueryStore from a parent {@link QueryStoreProvider} component
 * If there is none it throws an error
 */
export function useQueryStore() {
  const store = useContext(QueryStoreContext);
  if (!store) throw new Error("Missing QueryStoreProvider");
  return store;
}
