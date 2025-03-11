import { Query } from "applesauce-core";
import { filter, map, merge } from "rxjs";
import { getWalletMints, getWalletPrivateKey, isWalletLocked, WALLET_KIND } from "../helpers/wallet.js";
import { NostrEvent } from "nostr-tools";

export type WalletInfo =
  | { locked: true; event: NostrEvent }
  | {
      locked: false;
      event: NostrEvent;
      privateKey: Uint8Array;
      mints: string[];
    };

/** A query to get the state of a NIP-60 wallet */
export function WalletQuery(pubkey: string): Query<WalletInfo | undefined> {
  return {
    key: pubkey,
    run: (events) =>
      merge(
        // get the latest replaceable event
        events.replaceable(WALLET_KIND, pubkey),
        // and listen for any updates to matching events
        events.updates.pipe(filter((e) => e.kind === WALLET_KIND && e.pubkey === pubkey)),
      ).pipe(
        map((wallet) => {
          if (!wallet) return;

          if (isWalletLocked(wallet)) return { locked: true, event: wallet };

          const mints = getWalletMints(wallet);
          const privateKey = getWalletPrivateKey(wallet);

          return { locked: false, mints, privateKey, event: wallet };
        }),
      ),
  };
}
