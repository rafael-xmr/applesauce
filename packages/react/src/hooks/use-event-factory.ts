import { useContext } from "react";
import { EventFactory } from "applesauce-factory";

import { FactoryContext } from "../providers/factory-provider.js";

export function useEventFactory(require: false): EventFactory | undefined;
export function useEventFactory(require: true): EventFactory;
export function useEventFactory(): EventFactory;
export function useEventFactory(require = true) {
  const factory = useContext(FactoryContext);
  if (!require && !factory) throw new Error("Missing EventFactoryProvider");
  return factory;
}
