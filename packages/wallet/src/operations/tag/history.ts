import { TagOperation } from "applesauce-factory";
import { ensureMarkedEventPointerTag, ensureSingletonTag, Nip10TagMarker } from "applesauce-factory/helpers";
import { EventPointer } from "nostr-tools/nip19";

import { HistoryDirection } from "../../helpers/history.js";

/** Sets the "direction" tag on wallet history tags */
export function setHistoryDirectionTag(direction: HistoryDirection): TagOperation {
  return (tags) => ensureSingletonTag(tags, ["direction", direction], true);
}

/** Sets the "amount" tag on wallet history tags */
export function setHistoryAmountTag(amount: number): TagOperation {
  return (tags) => ensureSingletonTag(tags, ["amount", String(amount)], true);
}

/** Sets the "fee" tag in wallet history tags */
export function setHistoryFeeTag(fee: number): TagOperation {
  return (tags) => ensureSingletonTag(tags, ["fee", String(fee)], true);
}

export function setHistoryMintTag(mint: string): TagOperation {
  return (tags) => ensureSingletonTag(tags, ["mint", mint], true);
}

/** Includes "created" "e" tags in wallet history tags */
export function includeHistoryCreatedTags(created: (string | EventPointer)[]): TagOperation {
  return (tags) => {
    for (const id of created) {
      tags = ensureMarkedEventPointerTag(tags, typeof id === "string" ? { id } : id, "created" as Nip10TagMarker);
    }
    return tags;
  };
}

/** Includes the "redeemed" tags in wallet history tags */
export function includeHistoryRedeemedTags(redeemed: (string | EventPointer)[]): TagOperation {
  return (tags) => {
    for (const id of redeemed) {
      tags = ensureMarkedEventPointerTag(tags, typeof id === "string" ? { id } : id, "redeemed" as Nip10TagMarker);
    }
    return tags;
  };
}
