import { MonoTypeOperatorFunction, tap } from "rxjs";
import { addSeenRelay } from "applesauce-core/helpers";
import { SubscriptionResponse } from "../types.js";

/** Marks all events as from the relay */
export function markFromRelay(relay: string): MonoTypeOperatorFunction<SubscriptionResponse> {
  return (source) =>
    source.pipe(
      tap((message) => {
        if (typeof message !== "string") addSeenRelay(message, relay);
      }),
    );
}
