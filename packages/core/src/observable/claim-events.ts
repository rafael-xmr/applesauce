import { finalize, MonoTypeOperatorFunction, tap } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { Database } from "../event-store/database.js";

/** keep a claim on any event that goes through this observable, claims are removed when the observable completes */
export function claimEvents<T extends NostrEvent|undefined>(database: Database): MonoTypeOperatorFunction<T> {
  return (source) => {
    const seen = new Set<NostrEvent>();

    return source.pipe(
      // claim all events
      tap((e) => {
        if (e) {
          seen.add(e);
          database.claimEvent(e, source);
        }
      }),
      // remove claims on cleanup
      finalize(() => {
        for (const e of seen) database.removeClaim(e, source);
      }),
    );
  };
}
