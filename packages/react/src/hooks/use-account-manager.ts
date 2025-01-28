import { useContext } from "react";
import { AccountsContext } from "../providers/accounts-provider.js";

export function useAccountManager() {
  return useContext(AccountsContext);
}
