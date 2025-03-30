import { NostrEvent } from "nostr-tools";
import { combineLatest, filter, map, merge, Observable } from "rxjs";
import { Filter } from "nostr-tools";

import { IRelay, Nip01Actions, PublishResponse, SubscriptionResponse } from "./types.js";
import { onlyEvents } from "./operators/only-events.js";
import { nanoid } from "nanoid";

export class RelayGroup implements Nip01Actions {
  constructor(public relays: IRelay[]) {}

  req(filters: Filter | Filter[], id = nanoid()): Observable<SubscriptionResponse> {
    const requests = this.relays.reduce(
      (acc, r) => ({ ...acc, [r.url]: r.req(filters, id) }),
      {} as Record<string, Observable<SubscriptionResponse>>,
    );

    // Create stream of events only
    const events = merge(...Object.values(requests)).pipe(onlyEvents());

    // Create stream that emits EOSE when all relays have sent EOSE
    const eose = combineLatest(
      // Create a new map of requests that only emits EOSE
      Object.fromEntries(
        Object.entries(requests).map(([url, observable]) => [url, observable.pipe(filter((m) => m === "EOSE"))]),
      ),
    ).pipe(map(() => "EOSE" as const));

    // Merge events and the single EOSE stream
    return merge(events, eose);
  }

  event(event: NostrEvent): Observable<PublishResponse> {
    return merge(...this.relays.map((r) => r.event(event)));
  }
}
