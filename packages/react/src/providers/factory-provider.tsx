import { EventFactory } from "applesauce-factory";
import { createContext, PropsWithChildren } from "react";

export const FactoryContext = createContext<EventFactory | undefined>(undefined);

/** Provides an EventFactory to the component tree */
export function FactoryProvider({ factory, children }: PropsWithChildren<{ factory?: EventFactory }>) {
  return <FactoryContext.Provider value={factory}>{children}</FactoryContext.Provider>;
}
