import { NostrEvent, type Filter } from "nostr-tools";
import { combineLatest, endWith, ignoreElements, merge, Observable, takeWhile } from "rxjs";
import { nanoid } from "nanoid";

import { Relay, PublishResponse, SubscriptionResponse } from "./relay.js";
import { onlyEvents } from "./operators/only-events.js";

export class RelayPool {
  relays = new Map<string, Relay>();

  /** Get or create a new relay connection */
  relay(url: string): Relay {
    let relay = this.relays.get(url);
    if (relay) return relay;
    else {
      relay = new Relay(url);
      this.relays.set(url, relay);
      return relay;
    }
  }

  /** Make a REQ to multiple relays but does not deduplicate events */
  req(relays: string[], filters: Filter[], id = nanoid()): Observable<SubscriptionResponse> {
    // create a REQ observable for each relay
    const requests = relays.map((url) => this.relay(url).req(filters, id));

    // create an observable that completes when all relays send EOSE
    const eose = merge(
      // create an array of observables for each relay that completes when EOSE
      ...requests.map((o) =>
        o.pipe(
          // complete on EOSE message
          takeWhile((m) => m !== "EOSE"),
        ),
      ),
    ).pipe(
      // ignore all messages
      ignoreElements(),
      // emit EOSE on complete
      endWith("EOSE" as const),
    );

    // create a stream that only emits events
    const events = merge(...requests).pipe(onlyEvents());

    // merge events and single EOSE streams
    return merge(events, eose);
  }

  /** Send an EVENT message to multiple relays */
  event(relays: string[], event: NostrEvent): Observable<PublishResponse[]> {
    return combineLatest(relays.map((url) => this.relay(url).event(event)));
  }
}
