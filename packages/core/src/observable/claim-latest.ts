import { finalize, MonoTypeOperatorFunction, tap } from "rxjs";
import { NostrEvent } from "nostr-tools";
import { Database } from "../event-store/database.js";

export function claimLatest(database: Database): MonoTypeOperatorFunction<NostrEvent | undefined> {
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
        // late claim
        if (latest) database.removeClaim(latest, source);
      }),
    );
  };
}
