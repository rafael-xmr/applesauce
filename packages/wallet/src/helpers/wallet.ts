import {
  getHiddenTags,
  getOrComputeCachedValue,
  HiddenContentSigner,
  isHiddenTagsLocked,
  unlockHiddenTags,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const WALLET_KIND = 17375;
export const WALLET_BACKUP_KIND = 375;

export const WalletPrivateKeySymbol = Symbol.for("wallet-private-key");
export const WalletMintsSymbol = Symbol.for("wallet-mints");

/** Returns if a wallet is locked */
export function isWalletLocked(wallet: NostrEvent): boolean {
  return isHiddenTagsLocked(wallet);
}

/** Unlocks a wallet and returns the hidden tags */
export async function unlockWallet(wallet: NostrEvent, signer: HiddenContentSigner): Promise<string[][]> {
  return await unlockHiddenTags(wallet, signer);
}

/** Returns the wallets mints */
export function getWalletMints(wallet: NostrEvent): string[] {
  return getOrComputeCachedValue(wallet, WalletMintsSymbol, () => {
    const tags = getHiddenTags(wallet);
    if (!tags) throw new Error("Wallet is locked");
    return tags.filter((t) => t[0] === "mint").map((t) => t[1]);
  });
}

/** Returns the wallets private key as a string */
export function getWalletPrivateKey(wallet: NostrEvent): string {
  return getOrComputeCachedValue(wallet, WalletPrivateKeySymbol, () => {
    const tags = getHiddenTags(wallet);
    if (!tags) throw new Error("Wallet is locked");

    const key = tags.find((t) => t[0] === "privkey" && t[1])?.[1];
    if (!key) throw new Error("Wallet missing private key");
    return key;
  });
}
