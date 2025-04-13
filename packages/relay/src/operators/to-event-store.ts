import { OperatorFunction, scan } from "rxjs";
import { IEventStore } from "applesauce-core";
import { NostrEvent } from "nostr-tools";

import { SubscriptionResponse } from "../types.js";

import { completeOnEose } from "./complete-on-eose.js";
import { insertEventIntoDescendingList } from "nostr-tools/utils";

/** Adds all events to event store and returns a deduplicated timeline */
export function toEventStore(eventStore: IEventStore): OperatorFunction<SubscriptionResponse, NostrEvent[]> {
  return (source) =>
    source.pipe(
      // Complete when there are not events
      completeOnEose(),
      // Add the events to an array
      scan((events, event) => {
        // Get the current instance of this event
        let e = eventStore.add(event);

        // If its not in the timeline, add it
        if (events.includes(e)) return events;
        else return insertEventIntoDescendingList(events, e);
      }, [] as NostrEvent[]),
    );
}
