import { useObservable } from "./use-observable.js";
import { IAccount } from "applesauce-accounts";
import { useAccountManager } from "./use-account-manager.js";

export function useActiveAccount(): IAccount | undefined {
  const manager = useAccountManager();
  return useObservable(manager.active$);
}
