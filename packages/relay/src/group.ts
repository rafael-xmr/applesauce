import { NostrEvent } from "nostr-tools";
import { catchError, endWith, ignoreElements, merge, Observable, of } from "rxjs";
import { Filter } from "nostr-tools";
import { nanoid } from "nanoid";

import { IRelay, Nip01Actions, PublishResponse, SubscriptionResponse } from "./types.js";
import { onlyEvents } from "./operators/only-events.js";
import { completeOnEose } from "./operators/complete-on-eose.js";

export class RelayGroup implements Nip01Actions {
  constructor(public relays: IRelay[]) {}

  req(filters: Filter | Filter[], id = nanoid(8)): Observable<SubscriptionResponse> {
    const requests = this.relays.reduce(
      (acc, relay) => ({
        ...acc,
        [relay.url]: relay.req(filters, id).pipe(
          // Ignore connection errors
          catchError(() => of("EOSE" as const)),
        ),
      }),
      {} as Record<string, Observable<SubscriptionResponse>>,
    );

    // Create stream of events only
    const events = merge(...Object.values(requests)).pipe(onlyEvents());

    // Create stream that emits EOSE when all relays have sent EOSE
    const eose = merge(
      // Create a new map of requests that only emits EOSE
      ...Object.values(requests).map((observable) => observable.pipe(completeOnEose(), ignoreElements())),
    ).pipe(
      // When all relays have sent EOSE, emit EOSE
      endWith("EOSE" as const),
    );

    // Merge events and the single EOSE stream
    return merge(events, eose);
  }

  event(event: NostrEvent): Observable<PublishResponse> {
    return merge(
      ...this.relays.map((relay) =>
        relay.event(event).pipe(
          // Catch error and return as PublishResponse
          catchError((err) =>
            of({ ok: false, from: relay.url, message: err?.message || "Unknown error" } satisfies PublishResponse),
          ),
        ),
      ),
    );
  }
}
