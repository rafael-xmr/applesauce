import { combineLatest, filter, map, scan, startWith } from "rxjs";
import { Query } from "applesauce-core";
import { NostrEvent } from "nostr-tools";

import { getHistoryRedeemed, isHistoryContentLocked, WALLET_HISTORY_KIND } from "../helpers/history.js";

/** Query that returns an array of redeemed event ids for a wallet */
export function WalletRedeemedQuery(pubkey: string): Query<string[]> {
  return (events) =>
    events
      .filters({ kinds: [WALLET_HISTORY_KIND], authors: [pubkey] })
      .pipe(scan((ids, history) => [...ids, ...getHistoryRedeemed(history)], [] as string[]));
}

/** A query that returns a timeline of wallet history events */
export function WalletHistoryQuery(pubkey: string, locked?: boolean | undefined): Query<NostrEvent[]> {
  return (events) => {
    const updates = events.updates.pipe(
      filter((e) => e.kind === WALLET_HISTORY_KIND && e.pubkey === pubkey),
      startWith(undefined),
    );
    const timeline = events.timeline({ kinds: [WALLET_HISTORY_KIND], authors: [pubkey] });

    return combineLatest([updates, timeline]).pipe(
      map(([_, history]) => {
        if (locked === undefined) return history;
        else return history.filter((entry) => isHistoryContentLocked(entry) === locked);
      }),
    );
  };
}
