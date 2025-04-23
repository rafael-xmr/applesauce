import { NostrEvent } from "nostr-tools";
import { filter, merge, MonoTypeOperatorFunction, tap } from "rxjs";
import { IStreamEventStore } from "../event-store/interface.js";

/** Lists for any updates to the latest event and remits it */
export function listenLatestUpdates(eventStore: IStreamEventStore): MonoTypeOperatorFunction<NostrEvent | undefined> {
  return (source) => {
    let latest: NostrEvent | undefined;

    return merge(
      // Get the latest event
      source.pipe(tap((value) => (latest = value))),
      // listen for updates
      eventStore.updates.pipe(filter((e) => e.id === latest?.id)),
    );
  };
}
