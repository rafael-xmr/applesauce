import { Query } from "applesauce-core";
import { getHistoryRedeemed, WALLET_HISTORY_KIND } from "../helpers/history.js";
import { scan } from "rxjs";

/** Query that returns an array of redeemed event ids for a wallet */
export function WalletRedeemedQuery(pubkey: string): Query<string[]> {
  return {
    key: pubkey,
    run: (events) =>
      events
        .filters({ kinds: [WALLET_HISTORY_KIND], authors: [pubkey] })
        .pipe(scan((ids, history) => [...ids, ...getHistoryRedeemed(history)], [] as string[])),
  };
}
