import { useObservable } from "./use-observable.js";
import { useAccountManager } from "./use-account-manager.js";

export function useActiveAccount() {
  const manager = useAccountManager();
  return useObservable(manager?.active$);
}
