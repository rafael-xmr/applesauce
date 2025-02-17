import { finalize, MonoTypeOperatorFunction, tap } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { Database } from "../event-store/database.js";

/** keep a claim on any event that goes through this observable, claims are removed when the observable completes */
export function claimEvents<T extends NostrEvent[] | NostrEvent | undefined>(
  database: Database,
): MonoTypeOperatorFunction<T> {
  return (source) => {
    const seen = new Set<NostrEvent>();

    return source.pipe(
      // claim all events
      tap((message) => {
        if (message === undefined) return;
        if (Array.isArray(message)) {
          for (const event of message) {
            seen.add(event);
            database.claimEvent(event, source);
          }
        } else {
          seen.add(message);
          database.claimEvent(message, source);
        }
      }),
      // remove claims on cleanup
      finalize(() => {
        for (const e of seen) database.removeClaim(e, source);
      }),
    );
  };
}
