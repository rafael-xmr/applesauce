import { useContext } from "react";

import { FactoryContext } from "../providers/factory-provider.js";

export function useEventFactory() {
  return useContext(FactoryContext);
}
