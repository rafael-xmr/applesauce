import { finalize, MonoTypeOperatorFunction, tap } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { type Database } from "../event-store/database.js";

/** An operator that claims the latest event with the database */
export function claimLatest<T extends NostrEvent | undefined>(database: Database): MonoTypeOperatorFunction<T> {
  return (source) => {
    let latest: NostrEvent | undefined = undefined;

    return source.pipe(
      tap((event) => {
        // remove old claim
        if (latest) database.removeClaim(latest, source);
        // claim new event
        if (event) database.claimEvent(event, source);
        // update state
        latest = event;
      }),
      finalize(() => {
        // remove latest claim
        if (latest) database.removeClaim(latest, source);
      }),
    );
  };
}
