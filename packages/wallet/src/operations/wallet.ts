import { EventOperation } from "applesauce-factory";
import { NostrEvent } from "nostr-tools";
import { WALLET_KIND } from "../helpers/wallet.js";

/** Sets the content of a kind 375 wallet backup event */
export function setWalletBackupContent(wallet: NostrEvent): EventOperation {
  return async (draft, ctx) => {
    if (wallet.kind !== WALLET_KIND) throw new Error(`Cant create a wallet backup from kind ${wallet.kind}`);
    if (!wallet.content) throw new Error("Wallet missing content");

    const pubkey = await ctx.signer?.getPublicKey();
    if (wallet.pubkey !== pubkey) throw new Error("Wallet pubkey dose not match signer pubkey");

    return { ...draft, content: wallet.content };
  };
}
