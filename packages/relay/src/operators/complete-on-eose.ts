import { MonoTypeOperatorFunction, OperatorFunction, takeWhile } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { SubscriptionResponse } from "../types.js";

export function completeOnEose(includeEose: true): MonoTypeOperatorFunction<SubscriptionResponse>;
export function completeOnEose(): OperatorFunction<SubscriptionResponse, NostrEvent>;
export function completeOnEose(includeEose: false): OperatorFunction<SubscriptionResponse, NostrEvent>;
export function completeOnEose(
  includeEose?: boolean,
): OperatorFunction<SubscriptionResponse, NostrEvent> | MonoTypeOperatorFunction<SubscriptionResponse> {
  if (includeEose) return takeWhile((m) => m !== "EOSE", true);
  else return takeWhile((m) => m !== "EOSE", false);
}
