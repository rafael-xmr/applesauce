import { OperatorFunction, takeWhile } from "rxjs";
import { SubscriptionResponse } from "../types.js";
import { NostrEvent } from "nostr-tools";

export function completeOnEose(): OperatorFunction<SubscriptionResponse, NostrEvent> {
  return takeWhile((m) => m !== "EOSE");
}
