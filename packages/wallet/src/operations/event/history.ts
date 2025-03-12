import { EventOperation, TagOperation } from "applesauce-factory";
import { HistoryContent } from "../../helpers/history.js";
import { modifyHiddenTags, modifyPublicTags } from "applesauce-factory/operations/event";
import {
  includeHistoryCreatedTags,
  includeHistoryRedeemedTags,
  setHistoryAmountTag,
  setHistoryDirectionTag,
  setHistoryFeeTag,
  setHistoryMintTag,
} from "../tag/history.js";
import { EventPointer } from "nostr-tools/nip19";

/** Sets the encrypted tags of a wallet history event */
export function setHistoryContent(content: HistoryContent): EventOperation {
  const operations: TagOperation[] = [
    setHistoryDirectionTag(content.direction),
    setHistoryAmountTag(content.amount),
    includeHistoryCreatedTags(content.created),
  ];

  if (content.fee !== undefined) operations.push(setHistoryFeeTag(content.fee));
  if (content.mint !== undefined) operations.push(setHistoryMintTag(content.mint));

  return modifyHiddenTags(...operations);
}

/** Sets the "redeemed" tags on a wallet history event */
export function setHistoryRedeemed(redeemed: (string | EventPointer)[]): EventOperation {
  return modifyPublicTags(includeHistoryRedeemedTags(redeemed));
}
