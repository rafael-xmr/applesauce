import {
  getHiddenContent,
  getOrComputeCachedValue,
  HiddenContentSigner,
  isHiddenContentLocked,
  unlockHiddenContent,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const WALLET_TOKEN_KIND = 7375;

export type TokenDetails = {
  /** Cashu mint for the proofs */
  mint: string;
  /** Cashu proofs */
  proofs: { amount: number; secret: string; C: string; id: string }[];
  /** tokens that were destroyed in the creation of this token (helps on wallet state transitions) */
  del: string[];
};

export const TokenDetailsSymbol = Symbol.for("token-details");

/** Returns the decrypted and parsed details of a 7375 token event */
export function getTokenDetails(token: NostrEvent): TokenDetails {
  return getOrComputeCachedValue(token, TokenDetailsSymbol, () => {
    const plaintext = getHiddenContent(token);
    if (!plaintext) throw new Error("Token is locked");

    const details = JSON.parse(plaintext) as TokenDetails;

    if (!details.mint) throw new Error("Token missing mint");
    if (!details.proofs) details.proofs = [];
    if (!details.del) details.del = [];

    return details;
  });
}

/** Returns if token details are locked */
export function isTokenDetailsLocked(token: NostrEvent): boolean {
  return isHiddenContentLocked(token);
}

/** Decrypts a k:7375 token event */
export async function unlockTokenDetails(token: NostrEvent, signer: HiddenContentSigner): Promise<TokenDetails> {
  if (isHiddenContentLocked(token)) await unlockHiddenContent(token, signer);
  return getTokenDetails(token);
}
