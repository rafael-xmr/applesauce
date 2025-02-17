import { IAccount } from "applesauce-accounts";
import { useObservableEagerState } from "observable-hooks";

import { useAccountManager } from "./use-account-manager.js";

export function useAccounts(): IAccount[] {
  const manager = useAccountManager();
  return useObservableEagerState(manager.accounts$);
}
