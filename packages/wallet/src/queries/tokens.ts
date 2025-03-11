import { Query } from "applesauce-core";
import { combineLatest, filter, map, startWith } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { getTokenContent, isTokenContentLocked, WALLET_TOKEN_KIND } from "../helpers/tokens.js";

/** removes deleted events from sorted array */
function filterDeleted(tokens: NostrEvent[]) {
  const deleted = new Set<string>();
  return Array.from(tokens)
    .reverse()
    .filter((token) => {
      // skip this event if it a newer event says its deleted
      if (deleted.has(token.id)) return false;
      // skip if token is locked
      if (isTokenContentLocked(token)) return false;
      else {
        // add ids to deleted array
        const details = getTokenContent(token);
        for (const id of details.del) deleted.add(id);
      }

      return true;
    })
    .reverse();
}

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
        // filter out locked tokens
        map(([_, tokens]) => {
          if (locked === undefined) return tokens;
          else return tokens.filter((t) => isTokenContentLocked(t) === locked);
        }),
        // remove deleted events
        map(filterDeleted),
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
        map(([_, tokens]) => tokens),
        // filter out deleted tokens
        map(filterDeleted),
        // map tokens to totals
        map((tokens) =>
          tokens.reduce(
            (totals, token) => {
              const details = getTokenContent(token);
              const total = details.proofs.reduce((t, p) => t + p.amount, 0);
              return { ...totals, [details.mint]: (totals[details.mint] ?? 0) + total };
            },
            {} as Record<string, number>,
          ),
        ),
      );
    },
  };
}
