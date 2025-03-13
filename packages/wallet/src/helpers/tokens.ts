import {
  getHiddenContent,
  getOrComputeCachedValue,
  HiddenContentSigner,
  isHiddenContentLocked,
  isHiddenTagsLocked,
  lockHiddenContent,
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
export const TokenProofsTotalSymbol = Symbol.for("token-proofs-total");

/**
 * Returns the decrypted and parsed details of a 7375 token event
 * @throws
 */
export function getTokenContent(token: NostrEvent): TokenContent | undefined {
  if (isHiddenTagsLocked(token)) return undefined;

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
  return getTokenContent(token)!;
}

/** Removes the unencrypted hidden content */
export function lockTokenContent(token: NostrEvent) {
  Reflect.deleteProperty(token, TokenContentSymbol);
  Reflect.deleteProperty(token, TokenProofsTotalSymbol);
  lockHiddenContent(token);
}

/** Gets the totaled amount of proofs in a token event */
export function getTokenProofsTotal(token: NostrEvent): number | undefined {
  if (isTokenContentLocked(token)) return undefined;

  return getOrComputeCachedValue(token, TokenProofsTotalSymbol, () => {
    const content = getTokenContent(token)!;
    return content.proofs.reduce((t, p) => t + p.amount, 0);
  });
}

/**
 * Selects oldest tokens that total up to more than the min amount
 * @throws
 */
export function dumbTokenSelection(tokens: NostrEvent[], minAmount: number, mint?: string) {
  // sort newest to oldest
  const sorted = tokens
    .filter((token) => !isTokenContentLocked(token) && (mint ? getTokenContent(token)!.mint === mint : true))
    .sort((a, b) => b.created_at - a.created_at);

  const total = sorted.reduce((t, token) => t + getTokenProofsTotal(token)!, 0);
  if (total < minAmount) throw new Error("Insufficient funds");

  let amount = 0;
  const selected: NostrEvent[] = [];
  while (amount < minAmount) {
    const token = sorted.pop();
    if (!token) throw new Error("Ran out of tokens");

    selected.push(token);
    amount += getTokenProofsTotal(token)!;
  }

  return selected;
}
