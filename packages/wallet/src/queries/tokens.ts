import { Query } from "applesauce-core";
import { combineLatest, filter, map, startWith } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { getTokenDetails, isTokenDetailsLocked, WALLET_TOKEN_KIND } from "../helpers/tokens.js";

/** A query that subscribes to all token events for a wallet, passing locked will filter by token locked status */
export function WalletTokensQuery(pubkey: string, locked?: boolean | undefined): Query<NostrEvent[]> {
  return {
    key: pubkey + locked,
    run: (events) => {
      const updates = events.updates.pipe(
        filter((e) => e.kind === WALLET_TOKEN_KIND && e.pubkey === pubkey),
        startWith(undefined),
      );
      const timeline = events.timeline({ kinds: [WALLET_TOKEN_KIND], authors: [pubkey] });

      return combineLatest([updates, timeline]).pipe(
        map(([_, tokens]) => {
          if (locked === undefined) return tokens;
          else return tokens.filter((t) => isTokenDetailsLocked(t) === locked);
        }),
      );
    },
  };
}

/** A query that returns the visible balance of a wallet for each mint */
export function WalletBalanceQuery(pubkey: string): Query<Record<string, number>> {
  return {
    key: pubkey,
    run: (events) => {
      const updates = events.updates.pipe(
        filter((e) => e.kind === WALLET_TOKEN_KIND && e.pubkey === pubkey),
        startWith(undefined),
      );
      const timeline = events.timeline({ kinds: [WALLET_TOKEN_KIND], authors: [pubkey] });

      return combineLatest([updates, timeline]).pipe(
        map(([_, tokens]) => {
          const deleted = new Set<string>();

          return (
            tokens
              // count the tokens from newest to oldest (so del gets applied correctly)
              .reverse()
              .reduce(
                (totals, token) => {
                  // skip this event if it a newer event says its deleted
                  if (deleted.has(token.id)) return totals;
                  // skip if token is locked
                  if (isTokenDetailsLocked(token)) return totals;

                  const details = getTokenDetails(token);
                  if (!details) return totals;

                  // add deleted ids
                  for (const id of details.del) deleted.add(id);

                  const total = details.proofs.reduce((t, p) => t + p.amount, 0);
                  return { ...totals, [details.mint]: (totals[details.mint] ?? 0) + total };
                },
                {} as Record<string, number>,
              )
          );
        }),
      );
    },
  };
}
