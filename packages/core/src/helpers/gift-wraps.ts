import { NostrEvent, UnsignedEvent, verifyEvent } from "nostr-tools";
import { getHiddenContent, HiddenContentSigner, isHiddenContentLocked, unlockHiddenContent } from "./hidden-content.js";
import { getOrComputeCachedValue } from "./cache.js";

export const GiftWrapSealSymbol = Symbol.for("gift-wrap-seal");
export const GiftWrapEventSymbol = Symbol.for("gift-wrap-event");

/** Returns the unsigned seal event in a gift-wrap event */
export function getGiftWrapSeal(gift: NostrEvent): NostrEvent | undefined {
  if (isHiddenContentLocked(gift)) return undefined;

  return getOrComputeCachedValue(gift, GiftWrapSealSymbol, () => {
    const plaintext = getHiddenContent(gift);
    if (!plaintext) throw new Error("Gift-wrap is locked");
    const seal = JSON.parse(plaintext) as NostrEvent;

    // verify the seal is valid
    verifyEvent(seal);

    return seal;
  });
}

/** Returns the unsigned event in the gift-wrap seal */
export function getGiftWrapEvent(gift: NostrEvent): UnsignedEvent | undefined {
  if (isHiddenContentLocked(gift)) return undefined;

  return getOrComputeCachedValue(gift, GiftWrapEventSymbol, () => {
    const seal = getGiftWrapSeal(gift);
    if (!seal) throw new Error("Gift is locked");
    const plaintext = getHiddenContent(seal);
    if (!plaintext) throw new Error("Gift-wrap seal is locked");
    const event = JSON.parse(plaintext) as UnsignedEvent;

    if (event.pubkey !== seal.pubkey) throw new Error("Seal author does not match content");

    return event;
  });
}

/** Returns if a gift-wrap event or gift-wrap seal is locked */
export function isGiftWrapLocked(gift: NostrEvent): boolean {
  return isHiddenContentLocked(gift) || isHiddenContentLocked(getGiftWrapSeal(gift)!);
}

/** Unlocks and returns the unsigned seal event in a gift-wrap */
export async function unlockGiftWrap(gift: NostrEvent, signer: HiddenContentSigner): Promise<UnsignedEvent> {
  if (isHiddenContentLocked(gift)) await unlockHiddenContent(gift, signer);
  const seal = getGiftWrapSeal(gift)!;
  if (isHiddenContentLocked(seal)) await unlockHiddenContent(seal, signer);
  return getGiftWrapEvent(gift)!;
}
