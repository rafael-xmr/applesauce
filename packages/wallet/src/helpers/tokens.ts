import {
  getHiddenContent,
  getOrComputeCachedValue,
  HiddenContentSigner,
  isHiddenContentLocked,
  unlockHiddenContent,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const WALLET_TOKEN_KIND = 7375;

export type TokenContent = {
  /** Cashu mint for the proofs */
  mint: string;
  /** Cashu proofs */
  proofs: { amount: number; secret: string; C: string; id: string }[];
  /** The cashu unit */
  unit?: string;
  /** tokens that were destroyed in the creation of this token (helps on wallet state transitions) */
  del: string[];
};

export const TokenContentSymbol = Symbol.for("token-content");

/** Returns the decrypted and parsed details of a 7375 token event */
export function getTokenContent(token: NostrEvent): TokenContent {
  return getOrComputeCachedValue(token, TokenContentSymbol, () => {
    const plaintext = getHiddenContent(token);
    if (!plaintext) throw new Error("Token is locked");

    const details = JSON.parse(plaintext) as TokenContent;

    if (!details.mint) throw new Error("Token missing mint");
    if (!details.proofs) throw new Error("Token missing proofs");
    if (!details.del) details.del = [];

    return details;
  });
}

/** Returns if token details are locked */
export function isTokenContentLocked(token: NostrEvent): boolean {
  return isHiddenContentLocked(token);
}

/** Decrypts a k:7375 token event */
export async function unlockTokenContent(token: NostrEvent, signer: HiddenContentSigner): Promise<TokenContent> {
  if (isHiddenContentLocked(token)) await unlockHiddenContent(token, signer);
  return getTokenContent(token);
}
