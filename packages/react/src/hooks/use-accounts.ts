import { useObservable } from "./use-observable.js";
import { useAccountManager } from "./use-account-manager.js";

export function useAccounts() {
  const manager = useAccountManager();
  return useObservable(manager?.accounts$);
}
