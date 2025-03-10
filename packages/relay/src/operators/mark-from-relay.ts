import { MonoTypeOperatorFunction, tap } from "rxjs";
import { SubscriptionResponse } from "../relay.js";
import { addSeenRelay } from "applesauce-core/helpers";

/** Marks all events as from the relay */
export function markFromRelay(relay: string): MonoTypeOperatorFunction<SubscriptionResponse> {
  return (source) =>
    source.pipe(
      tap((message) => {
        if (typeof message !== "string") addSeenRelay(message, relay);
      }),
    );
}
