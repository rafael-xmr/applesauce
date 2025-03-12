import { createContext, PropsWithChildren } from "react";
import { ActionHub } from "applesauce-actions";

export const ActionsContext = createContext<ActionHub | undefined>(undefined);

/** Provides an ActionHub to the component tree */
export function ActionsProvider({ actionHub, children }: PropsWithChildren<{ actionHub?: ActionHub }>) {
  return <ActionsContext.Provider value={actionHub}>{children}</ActionsContext.Provider>;
}
