import { createContext, PropsWithChildren } from "react";
import { AccountManager } from "applesauce-accounts";

export const AccountsContext = createContext<AccountManager | undefined>(undefined);

/** Provides an AccountManager to the component tree */
export function AccountsProvider({ manager, children }: PropsWithChildren<{ manager?: AccountManager }>) {
  return <AccountsContext.Provider value={manager}>{children}</AccountsContext.Provider>;
}
