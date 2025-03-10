import { Query } from "applesauce-core";
import { filter, map, merge } from "rxjs";
import { getWalletMints, getWalletPrivateKey, isWalletLocked, WALLET_KIND } from "../helpers/wallet.js";

export type WalletInfo =
  | { locked: true }
  | {
      locked: false;
      privateKey: string;
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

          if (isWalletLocked(wallet)) return { locked: true };

          const mints = getWalletMints(wallet);
          const privateKey = getWalletPrivateKey(wallet);

          return { locked: false, mints, privateKey };
        }),
      ),
  };
}
